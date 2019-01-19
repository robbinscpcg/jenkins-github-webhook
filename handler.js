'use strict';

const crypto = require('crypto');
const rp = require('request-promise');

function signRequestBody(key, body) {
    return `sha1=${crypto.createHmac('sha1', key).update(body, 'utf-8').digest('hex')}`;
}

module.exports.githubWebhookListener = (event, context) => {

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

    client.getSecretValue({SecretId: secretName}, function(err, data) {
    if (err) {
        if (err.code === 'DecryptionFailureException')
            // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InternalServiceErrorException')
            // An error occurred on the server side.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InvalidParameterException')
            // You provided an invalid value for a parameter.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'InvalidRequestException')
            // You provided a parameter value that is not valid for the current state of the resource.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
        else if (err.code === 'ResourceNotFoundException')
            // We can't find the resource that you asked for.
            // Deal with the exception here, and/or rethrow at your discretion.
            throw err;
    }
    else {
        // Decrypts secret using the associated KMS CMK.
        // Depending on whether the secret is a string or binary, one of these fields will be populated.
        if ('SecretString' in data) {
            secret = data.SecretString;
        } else {
            let buff = new Buffer(data.SecretBinary, 'base64');
            decodedBinarySecret = buff.toString('ascii');
        }
    }
    	
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
    let response = rp(options);
    
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
};
