import bcrypt from 'bcryptjs'

export  async function hashPassword(password:string){
   const salt=await bcrypt.genSalt(12);
   const hash= await bcrypt.hash(password,salt);
   return hash;
}


export async function comparePassword(hashedPassword:string,password:string){

   return await bcrypt.compare(password,hashedPassword);
}