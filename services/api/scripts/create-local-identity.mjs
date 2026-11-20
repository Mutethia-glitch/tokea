import {generateKeyPairSync,randomBytes} from "node:crypto";
import {mkdir,writeFile,stat} from "node:fs/promises";
import {join} from "node:path";
const path=join(process.cwd(),".local-secrets","tokea-identity.pem");
await mkdir(join(process.cwd(),".local-secrets"),{recursive:true,mode:0o700});
try{await stat(path);throw Error("Local identity key already exists. Refusing to overwrite it.");}
catch(error){if(error.code!=="ENOENT")throw error;}
const {privateKey}=generateKeyPairSync("rsa",{modulusLength:2048});
await writeFile(path,privateKey.export({type:"pkcs8",format:"pem"}),{mode:0o600,flag:"wx"});
console.log("Local signing key created in .local-secrets. Never commit or share it.");
console.log("Generate an OTP hash secret locally with node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))'.");
