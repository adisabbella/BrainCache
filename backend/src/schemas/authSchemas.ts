import z from "zod"

const userSchema =  z.object({
  username: z.string(),
  password: z.string()
});


export { userSchema };