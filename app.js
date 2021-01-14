const express = require('express');
const upload = require('express-fileupload');
const fs = require('fs');
const hbs = require('hbs');
const nodemailer = require('nodemailer');
const converter = require('libreoffice-convert');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require('dotenv').config();
var transporter = nodemailer.createTransport({
  service:"gmail",
  auth: {
    user: 'vojodjukanovic@gmail.com',
    pass: process.env.PASSWORD
  }

});

const app = express();
let currentFile = null;
let currentFileName=null;
let currentFileOriginal=null;

app.use("/pdfs",express.static(__dirname+"/pdfs"));
app.use("/views/css",express.static(__dirname+"/views/css"));
app.use(upload());

app.set('view engine', 'hbs');



app.post('/upload', function(req,res){
  
  if(req.files){
    const file = req.files.upfile;
    let exp = /.doc$|.docx$|.docm$|.dot$|.dotm$|.dotx$/;

    if(exp.test(file.name)){
      const originalName=file.name;
      const fileName= file.name.slice(0,file.name.indexOf(".doc"));
      let output =`./pdfs/${fileName}.pdf`;
      let i=1;
      while(fs.existsSync(output)){
        output=`./pdfs/${fileName}(${i}).pdf`;
        i++;
      }
      //console.log(output);
      converter.convert(file.data,".pdf",undefined,(err,done)=>{
        if(err){
          console.log(err);
        }
        fs.writeFileSync(output,done);
        currentFile = output;
        currentFileOriginal=originalName;
        currentFileName=fileName;
        let numOfConverts= parseInt(fs.readFileSync("./converted/number.txt").toString());
        numOfConverts=numOfConverts+1;
        fs.writeFileSync("./converted/number.txt",numOfConverts.toString());
        

        res.render("home.hbs",{
          numOfConverted:numOfConverts,
          originalName: originalName,
          downloadFile:output,
          download:true
        })
      })
    }else{

      let numOfConverts=parseInt(fs.readFileSync("./converted/number.txt").toString())
      res.render("home.hbs",{
        numOfConverted:numOfConverts,
        mistake:"Not a WORD FILE!!!!",
      })
    }
    

  }
  else{
    
    let numOfConverts=parseInt(fs.readFileSync("./converted/number.txt").toString())
    res.render("home.hbs",{
      numOfConverted:numOfConverts,
      mistake:"No File selected!!!!",
    })
    
  }
})

app.post("/sendMail", function(req,res){
  if(currentFile){
   // console.log("Current file")
   // console.log(currentFile);
   //console.log(req.body.email);
    let mailTo = req.body.email;
    mailOptions = {
      from: 'vojodjukanovic@gmail.com',
      to: mailTo,
      subject: `File from Word-Pdf converter`,
      text: 'Here is your file',
      attachments: [
        {   // utf-8 string as an attachment
            filename: currentFileName,
            path: currentFile
        }
      ],
    }


    
    let numOfConverts=parseInt(fs.readFileSync("./converted/number.txt").toString());
    res.render("home.hbs",{
      numOfConverted:numOfConverts,
      originalName: currentFileOriginal,
      downloadFile:currentFile,
      download:true,
      mailSent: "Mail succesfuly sent to",
    })
  }else{
      let numOfConverts=parseInt(fs.readFileSync("./converted/number.txt").toString())
      res.render("home.hbs",{
      numOfConverted:numOfConverts,
      mistake:"You didn't convert any file!!!",
    })
  }
})

app.get('/', function(req, res) {
  let numOfConverts=parseInt(fs.readFileSync("./converted/number.txt").toString())
  res.render("home.hbs",{
    numOfConverted:numOfConverts,
  })
})

  
app.listen(3000, () => {
  console.log("Server Started");
}); 
  
  