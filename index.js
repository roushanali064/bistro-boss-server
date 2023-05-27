const express = require('express');
require('dotenv').config
const app = express();
const cors = require('cors');
const port= process.env.PORT || 5000;


// middleWare
app.use(cors());
app.use(express.json());


app.get('/',(req,res)=>{
    res.send('bistro boss ready to fight')
})

app.listen(port,()=>{
    console.log(`bistro-boss running on port ${port}`)
})