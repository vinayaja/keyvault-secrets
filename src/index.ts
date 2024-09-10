import { getInput, setFailed, setSecret, exportVariable} from "@actions/core";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

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
              const secretValue = secret.value || '';
              setSecret(secretValue);
              exportVariable(secretProperties.name,secretValue);
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
                        const secretValue = secret.value || '';
                        setSecret(secretValue);
                        exportVariable(secretProperties.name,secretValue);            
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
                const secretValue = secret.value || '';
                setSecret(secretValue);
                exportVariable(secretName,secretValue);
            };
            
        };  

    }catch(error){
        setFailed((error as Error)?.message ?? "Unknown error");
    }
    
}

if(!process.env.JEST_WORKER_ID){
    run();
}