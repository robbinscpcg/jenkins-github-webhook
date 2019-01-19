'use strict';

const crypto = require('crypto');
const rp = require('request-promise');

function signRequestBody(key, body) {
    return `sha1=${crypto.createHmac('sha1', key).update(body, 'utf-8').digest('hex')}`;
}

module.exports.githubWebhookListener = async (event, context) => {

    const token = process.env.GITHUB_WEBHOOK_SECRET;
    const headers = event.headers;
    const sig = headers['X-Hub-Signature'];
    const githubEvent = headers['X-GitHub-Event'];
    const id = headers['X-GitHub-Delivery'];
    const calculatedSig = signRequestBody(token, event.body);

    var errMsg; // eslint-disable-line
    if (typeof token !== 'string') {
        return {
            statusCode: 401,
            body: JSON.stringify({
                message: errMsg,
                input: event
            })
        };
    }

    if (!sig) {
        errMsg = 'No X-Hub-Signature found on request';
        return {
            statusCode: 401,
            body: JSON.stringify({
                message: errMsg,
                input: event
            })
        };
    }

    if (!githubEvent) {
        errMsg = 'No X-Github-Event found on request';
        return {
            statusCode: 422,
            body: JSON.stringify({
                message: errMsg,
                input: event
            })
        };
    }

    if (!id) {
        errMsg = 'No X-Github-Delivery found on request';
        return {
            statusCode: 401,
            body: JSON.stringify({
                message: errMsg,
                input: event
            })
        };
    }

    if (sig !== calculatedSig) {
        errMsg = 'X-Hub-Signature incorrect. Github webhook token doesn\'t match';
        return {
            statusCode: 401,
            body: JSON.stringify({
                message: errMsg,
                input: event
            })
        };
    }
 
    /* Secrets Manager Code */
    // Load the AWS SDK
    var AWS = require('aws-sdk'),
        region = "us-east-1",
        secretName = "jenkins-prod-secrets",
        secret,
        decodedBinarySecret;

    // Create a Secrets Manager client
    var client = new AWS.SecretsManager({
        region: region
    });

   secretsmanager.getSecretValue(client, function(err, data) {
     if (err) console.log(err, err.stack); // an error occurred
     else     console.log(data);           // successful response
   /*
   data = {
    ARN: "arn:aws:secretsmanager:us-west-2:123456789012:secret:MyTestDatabaseSecret-a1b2c3", 
    CreatedDate: <Date Representation>, 
    Name: "MyTestDatabaseSecret", 
    SecretString: "{\n  \"username\":\"david\",\n  \"password\":\"BnQw&XDWgaEeT9XGTT29\"\n}\n", 
    VersionId: "EXAMPLE1-90ab-cdef-fedc-ba987SECRET1", 
    VersionStages: [
       "AWSPREVIOUS"
    ]
   }
   */
    });
    /* Jenkins Handler Code */
    
    const github_data = JSON.parse(event.body);
    console.log('Secrets ', secret);

    console.log('********** Executing Jenkins Job **********');
    console.log('Repo Name:\t', github_data.repository.name);
    console.log('Ref Name:\t', github_data.ref);
    console.log('Commit ID:\t', github_data.commits[0].id);
    console.log('Committer:\t', github_data.head_commit.committer.name);
    const url = 'http://' + secrets.jenkins_username + ':' + secrets.jenkins_token + '@http://rcsjenkins-alb-348372192.us-west-2.elb.amazonaws.com/job/' + github_data.repository.name + '/build?delay=0sec';
   
    var options = {
        method: 'POST',
        url: url,
        resolveWithFullResponse: true,
        simple: false
    };

    console.log("POST request to Colibri Jenkins Server");
    let response = await rp(options);
    
    if (response.statusCode != 200) {
      console.error(response.body);
      console.log("POST request to Jenkins Server failed!");
    } else {
      console.log("POST request to Jenkins Server succeeded"); 
    } 
   
   console.log('********** Jenkins Job Complete **********');
   return {
        statusCode: 200,
        body: JSON.stringify({
            input: event
        })
    };
});
