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
- Attempt 5: Manually copy/paste the cloudformation template into the designer to attempt deployment to see if my permissions will override. If so, then investigate breaking up the stack and grab the arn.
- Don't know the parameters.
- Deploying again to get the arn for the cloudwatch role so I can say: 
```
{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "GetRoleForLogs",
        "Effect": "Allow",
        "Action": ["iam:GetRole"],
        "Resource": ["arn:aws:iam:::roleArn"]
    }]
}
```
---------------
Attempt 6
- Created a policy to GetRole
- Attached the role to the deploying user
- Manually delete stack
- Deploy
- New error: Not allowed to `iam:PassRole`
----------------
Attempt 7
- Added iam:PassRole
- Manually deleted stack
- Redeploy
- New error: not allowd to `lambda:CreateFunction`
------------------
Attempt 8
- Added `lambda:CreateFunction`
- Attached to deploying user => no
    - can only have 10 policies per user.
- Manually deleted stack
--------------
- Had to delete some policies that were duplicates when I took another look at them 
Attempt 9
- New error: Don't have permission to `lambda:GetFunctionConfiguration`
- Manually delete stack
- Add the `lambda:GetFunctionConfiguration` to a `variable_api_policy` and attached to deploying user
- New error: Not allowed to `lambda:AddPermission`
----
Attempt 10
- Added the permission
- Manually deleted stack
- Redeployed. Success



- Maybe a role for deploying? 
- Just a guess but people probably spin up a vpc, put an EC2 instance in it
    - then they create the policies and set a condition for the source ip that corresponds to that vpc CIDR block

### IAM Policies
- S3
    - CreateBucket
    - PutObject
- ApiGateway
    - CreateGateway
- Lambda
    - CreateLambda


I haven't quite found the right way to write IAM policies from the CDK, but you can limit the reach of a given policy by referencing the ARN of the thing you probably had in mind when you were trying to get the thing to work. But I think the cdk takes care of that part for you?