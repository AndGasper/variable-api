# API Mark II

## Command to run to make the templates 
```
cdk synth --output ./template-output --verbose --profile {profileName}
```
Note: Having  the "outdir" key in the cdk.json file doesn't seem to work anymore?


## Command to deploy the template
```
cdk deploy ApiMk2 --verbose --profile {profileName}--require-approval never
```

Attempt 1: 
- Failed. 
    - CloudFormation status: ROLLBACK_FAILED
    - AWS::ApiGateway::Account => AccessDenied: User doesn't have permission to call iam:GetRole
---------
Attempt 2: 
- Attempt to remedy the IAM profile
    - Attached to the deploying user.
        - Policy Name: AWSAPIGatewayPushToCloudWatchLogs

Cannot redeploy a stack with a status of ROLLBACK_FAILED. 
Had to manually delete stack from aws console. 
---------
Attempt 3: 
- Rerun the deploy command from the terminal
- Same error; looks like it's the ApiGateway who is not allowed to iam:GetRole. This is either asynchronous programming gotcha or something simpler.
----------
Attempt 4:
- Manually delete the CloudFormation stack
- Rerun the deploy command from the terminal but output to file so I can actually read the message
Result: Failed again...looks like it made the file, but didn't actually output anything to it.



```
File: `restapi.d.ts`
export interface RestApiProps extends ResourceOptions {
    readonly cloudWatchRole?: boolean;
}
```
- My best guess is the cloudWatchRole gets created, but the execution context isn't allowed to get the role that's created hence the `iam:GetRole` 

```
By default, AWS CloudFormation uses a temporary session that it generates from your user credentials for stack operations. 
```
-------
Attempt 5:
- Manually delete the failed rollback stack
```
{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "GetRoleForLogs",
        "Effect": "Allow",
        "Action": ["iam:GetRole"],
        "Resource": "ResourceArn"
    }]
}
```


### IAM Policies
- S3
    - CreateBucket
    - PutObject
- ApiGateway
    - CreateGateway
- Lambda
    - CreateLambda


I haven't quite found the right way to write IAM policies from the CDK, but you can limit the reach of a given policy by referencing the ARN of the thing you probably had in mind when you were trying to get the thing to work. But I think the cdk takes care of that part for you?