import { getInput, setFailed } from "@actions/core";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { exec } from "child_process";

export async function run() {
    const keyvaultName = getInput("keyvault-name");
    const secretNames = getInput("secret-names")
    const secretNamePattern = getInput("secreat-name-pattern")

    try{
        const credential = new DefaultAzureCredential();
        const url = `https://${keyvaultName}.vault.azure.net`;

        const client = new SecretClient(url, credential);
        
        if((secretNames == '') && (secretNamePattern == ''))
        {
        console.log(`Getting all secrets from ${keyvaultName}`);
        for await (const secretProperties of client.listPropertiesOfSecrets()) {
            if (secretProperties.enabled) {
              const secret = await client.getSecret(secretProperties.name);
              const secretValue = secret.value;
              exec(`$secretvalue = "${secretValue}" && echo "::add-mask::$secretValue" && write-output "${secretProperties.name}=$secretValue" | out-file -filepath ${process.env.GITHUB_ENV} -Encoding utf8 -append`,  {'shell':'pwsh'}, (error) => {
                if (error) {
                  console.error(`exec error: ${error}`);
                  return;
                }
              });
            }
          }
        };

        if(secretNamePattern != '')
        {
            console.log(`Getting all secrets from ${keyvaultName} for pattern ${secretNamePattern}`);
            for await (const secretProperties of client.listPropertiesOfSecrets()) {
                if (secretProperties.enabled) {
                    if(secretProperties.name.includes(secretNamePattern))
                    {
                        const secret = await client.getSecret(secretProperties.name);
                        const secretValue = secret.value;
                    exec(`SECRET_VALUE=${secret.value} && echo "::add-mask::$SECRET_VALUE" && echo "${secretProperties.name}=$SECRET_VALUE" >> ${process.env.GITHUB_ENV}`,  {'shell':'bash'}, (error) => {
                        if (error) {
                        console.error(`exec error: ${error}`);
                        return;
                        }
                    });
                }
                }
            }
        };

        if(secretNames != '')
        {
            const allSecretName = secretNames.split(',');
            
            for(var secretName of allSecretName)
            {
                console.log(`Getting secret from ${keyvaultName} for name ${secretName}`);
                const secret = await client.getSecret(secretName);
                const secretValue = secret.value;
                exec(`$secretvalue = "${secretValue}" && echo "::add-mask::$secretValue" && write-output "${secretName}=$secretValue" | out-file -filepath ${process.env.GITHUB_ENV} -Encoding utf8 -append`,  {'shell':'pwsh'}, (error) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        return;
                    }
                });
            };
            
        };  

    }catch(error){
        setFailed((error as Error)?.message ?? "Unknown error");
    }
    
}

if(!process.env.JEST_WORKER_ID){
    run();
}