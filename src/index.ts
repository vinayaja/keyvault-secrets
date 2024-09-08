import { getInput, setFailed } from "@actions/core";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { exec } from "child_process";

export async function run() {
    const keyvaultName = getInput("keyvault-name");
    const secretName = getInput("secret-name")
    const secretNamePattern = getInput("secreat-name-pattern")

    try{
        const credential = new DefaultAzureCredential();
        const url = `https://${keyvaultName}.vault.azure.net`;

        const client = new SecretClient(url, credential);
        const latestSecret = await client.getSecret(secretName);
        
        exec(`New-Item -Path Env:\\${secretName} -Value "${latestSecret.value}"`,  {'shell':'pwsh'}, (error, stdout, stderr) => {
            if (error) {
              console.error(`exec error: ${error}`);
              return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
          });
        

    }catch(error){
        setFailed((error as Error)?.message ?? "Unknown error");
    }
    
}

if(!process.env.JEST_WORKER_ID){
    run();
}