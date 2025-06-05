import {useForm} from 'react-hook-form'
import {z} from 'zod'
import { zodResolver} from '@hookform/resolvers/zod'
import './login.css'

const userSchema = z.object({
    email:z.string().email(),
    password:z.string().min(8, "Input your password"),
})

export default function Login() {
    const {register,
        handleSubmit,
        formState: { errors, isSubmitting},
    } = useForm({
        defaultValues:{

        },
        resolver: zodResolver(userSchema),
    })
    const onSubmit = async(data) => {
        await new Promise((resolve) => setTimeout(resolve,1000));
        console.log(data)
    }

    return(
        <section>
            <h1>LoginForm</h1>
            <form onSubmit={handleSubmit(onSubmit)} id="LoginForm">
            <label htmlFor='email'>Email:</label>
            <input {...register("email")} type="email" name="text" placeholder="johnschmoe@gmail.com"/>
                {errors.email && (
                    <div className="errormsg">{errors.email.message}</div>
                )}
            <label htmlFor='password'>Password:</label>
            <input {...register("password")} type="password" name='password'/>
                {errors.password && (
                    <div className="errormsg">{errors.password.message}</div>
                )}

                <button disabled={isSubmitting} id="Login/Register">{isSubmitting ? "Loading" : "Login"}</button>
            </form>
                {errors.root && <div className="errosmsg">{errors.root.message}</div>}
        </section>
    )
}