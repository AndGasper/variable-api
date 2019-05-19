#!/usr/bin/env node
import { Construct, CfnOutput } from '@aws-cdk/cdk';
import { Function, Code, Runtime} from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { RestApi, LambdaIntegration, MethodLoggingLevel } from '@aws-cdk/aws-apigateway';
import { HostedZoneProvider, CnameRecord } from '@aws-cdk/aws-route53';


export interface NamedApiProps {
    domainName: string;
    apiPrefix: string;
};

type HttpMethodIntegration = {
    method: string;
    integration: LambdaIntegration;
};

export class NamedApi extends Construct {
    constructor(parent: Construct, name: string, props: NamedApiProps) {
        super(parent, name);
        const lambdaHandler = this.createLambdaBackend();
        const lambdaIntegrations = this.createLambdaIntegrations(lambdaHandler);
        const apiGateway = this.createApiGateway();
        this.associateApiGatewayWithLambda(apiGateway, lambdaIntegrations);
        const { domainName, apiPrefix } = props;
        const apiArn = apiGateway.executeApiArn('GET', '/');
        this.associateApiGatewayWithDns(apiArn, domainName, apiPrefix); 
        


        new CfnOutput(this, 'LambdaHandlerArn', {
            value: lambdaHandler.functionArn
        });
        new CfnOutput(this, 'ApiGatewayId', {
            value: apiGateway.restApiId
        });
    }
    /**
     * @name createLambdaBackend
     * @description - Create the s3 code bucket for the lambda code, create the lambda function
     * @return {Lambda.Function} handler - Bulk return of the lambda;
     */
    protected createLambdaBackend() { 
        const lambdaCodeBucket = new Bucket(this, 'LambdaCode');
        // seems to resolve relative to the project which is nice
        // I'm sure a path.resolve(__dirname, 'path', 'blah') could come in handy here
        // or maybe even a separate bucket
        const handlerConfig = {
            runtime: Runtime.NodeJS810,
            code: Code.directory('aws/src/lambda'),
            handler: 'lambda.main',
            environment: {
                BUCKET: lambdaCodeBucket.bucketName
            }
        };
        const handler = new Function(this, 'LambdaHandler', handlerConfig);
        return handler;
    }
    /**
     * @name createApiGateway
     * @description - Create api gateway REST API
     * @return {RestApi} api - broad return of the restapi
     * 
     */
    protected createApiGateway() { 
        // start apigateway logic
        const api = new RestApi(this, NamedApi.name, {
            deployOptions: {
                loggingLevel: MethodLoggingLevel.Info,
                dataTraceEnabled: true,
            },
            deploy: true,
            retainDeployments: true
        });
        return api; 
    }
    /**
     * @name createLambdaIntegrations
     * @description - Create API 
     * @return {HttpMethodIntegration[]} - An array of the HTTP methods and the associated lambda function 
     */
    protected createLambdaIntegrations(lambdaHandler: Function) {
        const integrations = [];
        const apiGatewayLambdaIntegrationConfig = {
            requestTemplates: { "application/json": '{ "statusCode": "200" }'}
        };
        const getLambdaIntegration = new LambdaIntegration(lambdaHandler, apiGatewayLambdaIntegrationConfig);
        const getIntegration: HttpMethodIntegration = {
            method: "GET",
            integration: getLambdaIntegration
        };
        integrations.push(getIntegration);

        const postLambdaIntegration = new LambdaIntegration(lambdaHandler);

        const postIntegraation: HttpMethodIntegration = {
            method: "POST",
            integration: postLambdaIntegration
        };

        integrations.push(postIntegraation);
        
        return integrations; 
    }
    /**
     * @name associateApiGatewayWithLambda
     * @param {RestApi} api - RestApi of Api Gateway
     * @param {HttpMethodIntegration} integrations - Array of LambdaIntegrations
     * @description - Associate a RestApi with the provided integrations
     * @return void;
     */
    protected associateApiGatewayWithLambda(api: RestApi, integrations: HttpMethodIntegration[]) {
        const apiRoot = api.root;
        integrations.map(({ method, integration }) => {
            apiRoot.addMethod(method, integration); 
        });
        
    }
    /**
     * @name - associateApiGatewayWithDns
     * @param {string} url - ApiGateway URL
     * @param {object} siteinfo - Domain name + api prefix
     * @return void
     */
    protected associateApiGatewayWithDns(apiArn: string, domainName: string, apiName: string, ) { 
        // cheat since I already have the cname
        const zone = new HostedZoneProvider(this, { domainName: domainName }).findAndImport(this, 'Zone');
        const cnameRecordConfig = {
            zone,
            recordName: `${apiName}.${domainName}`,
            recordValue: apiArn
        }
        new CnameRecord(this, 'ApiGatewayRecord', cnameRecordConfig);
        return;
    }
}
