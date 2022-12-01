require('dotenv').config();
const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");

require("./db/conn"); 
const Register = require("./models/registers");
const { application } = require("express");

const port = process.env.PORT || 3000;

const static_path = path.join(__dirname, "../public");
const template_path = path.join(__dirname, "../templates/views");
const partial_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}));

app.use(express.static(static_path));
app.set("view engine", "hbs");
app.set("views", template_path);
hbs.registerPartials(partial_path);

console.log(process.env.SECRET_KEY);


app.get("/", (req, res) => {
    res.render("index");
})

app.get("/secret", auth, (req, res) => {
    // console.log(`this the cookie awesome ${req.cookies.jwt}`); 
    res.render("secret");
})

app.get("/logout", auth, async(req, res) => {
    try {
        console.log(req.user);

        // for single logout

        // req.user.tokens = req.user.tokens.filter((curElement) => {
        //     return curElement.token != req.token
        // })

        // logout from all devices 

        req.user.tokens = [];


        res.clearCookie("jwt");

        console.log("logout seccessfully");

         await req.user.save();
         res.render("login");
    } catch (error) {
        res.status(500).send(error);
    }
})

app.get("/register", (req, res) => {
    res.render("register");
}) 


app.get("/login", (req, res) => {
    res.render("login");
})

 
// create a new user in our database 

app.post("/register", async (req, res) => {
    try {
        
        const password = req.body.password;
        const cpassword = req.body.confirmpassword;

        if (password === cpassword) {
            
            const registerEmp = new Register({
                firstname : req.body.firstname,
                lastname : req.body.lastname,
                email : req.body.email,
                gender: req.body.gender,
                phoneNumber : req.body.phoneNumber,
                age : req.body.age,
                password : password,
                confirmpassword :cpassword
            })

            const token = await registerEmp.generateAuthToken();
            console.log("the token part" + token);

            // the res.cookie() function is used to set the cookie name to value
            // the value parameter may be a string or object converted to JSON.

            res.cookie("jwt", token, {
                expires:new Date(Date.now() + 30000),
                httpOnly:true
            });

            console.log(cookie);

            const registered = await registerEmp.save();
            res.status(201).render("index");

        } else {
            res.send("password are not matching");
        }
    } catch (error) {
        res.status(400).send(error);
        console.log(error);
    }
})

//  login check 

app.post("/login", async (req, res) => {
    try {
        
        const email = req.body.email;
        const password = req.body.password;

        const userEmail = await Register.findOne({email:email});

        const isMatch = await bcrypt.compare(password, userEmail.password);

        const token = await userEmail.generateAuthToken();
        console.log("the token part" + token);

        res.cookie("jwt", token, {
            expires:new Date(Date.now() + 50000),
            httpOnly:true,
            // secure:true
        });

        

        if (isMatch) {
            res.status(201).render("index");
        } else {
            res.send("invalid login password details");
        }

    } catch (error) {
        res.status(400).send("invalid login details");  
    }
})



// hash password 

// const bcrypt = require("bcrypt");

// const securePassword = async (password) => {

//     const passwordHash = await bcrypt.hash(password, 10);
//     console.log(passwordHash);

//     const passwordmatch = await bcrypt.compare(password, passwordHash);
//     console.log(passwordmatch);

// }

// securePassword("faizi123");


// how to create jwt web token 

// const jwt = require("jsonwebtoken");

// const createToken = async() => {
//     const token = await jwt.sign({_id:"63820dd9170f4fa0929cc4a0"}, "mynameismdfaiyyajalamiliveinnoidasector", {
//         expiresIn:"2 seconds"
//     });
//     console.log(token);

//     const userVer = await jwt.verify(token, "mynameismdfaiyyajalamiliveinnoidasector");
//     console.log(userVer);
// }

// createToken();


app.listen(port, () => {
    console.log(`server is running at a port no ${port}`);
})