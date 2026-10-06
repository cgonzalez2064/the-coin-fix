// CommonJS startup wrapper for hosting managers; application code remains ESM.
const {resolve}=require('node:path');
process.chdir(resolve(__dirname,'../..'));
import('../index.mjs').then(async({createAuthServer})=>{
 const server=await createAuthServer();
 server.listen(Number(process.env.PORT||process.env.AUTH_PORT||3001),'127.0.0.1');
}).catch(error=>{console.error('Application startup failed:',error.message);process.exitCode=1;});
