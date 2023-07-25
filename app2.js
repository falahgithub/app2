require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

var countID = 1;
const allEmails = [];
const allnumbers = [];

////////////////////////////////////////////////////////////////////
mongoose.connect(process.env.MONGO_URL).then(()=>console.log("Connected to MongoDB"));

const contactSchema = new mongoose.Schema(
  {
    _id: { type: Number, default: 1 },
    phoneNumber: String,
    email: String,
    linkedId: Number,
    linkPrecedence: {
      type: String,
      enum: {
        values: ["secondary", "primary"],
      },
    },
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", contactSchema);

Contact.find().then((data) => {
  data.forEach(function (object) {
    allEmails.push(object.email);
    allnumbers.push(object.phoneNumber);
  });
});

async function SAVE(email, number, linkPrecedence, linkedId) {
  contact = new Contact({
    phoneNumber: number,
    email: email,
    linkPrecedence: linkPrecedence,
    linkedId: linkedId,
    _id: countID,
  });
  allEmails.push(email);
  allnumbers.push(number);
  countID++;
  await contact.save();
}

SAVE(
  (email = "lorraine@hillvalley.edu"),
  (number = "123456"),
  (linkPrecedence = "primary"),
  (linkedId = null)
);


////////////////////////////////////////////////////////////////////////

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.post("/identify", async function (req, res) {
  const {email, phoneNumber} = req.body;

  var id_primary = null;
//   var id_linked = null;
  const comprehensive_emails = [];
  const comprehensive_numbers = [];
  const secondaryIdArray = [];


    if (email && phoneNumber) {
      Create(email, phoneNumber);
    };

  setTimeout(async () => {
    await Contact.find({
      $or: [{ email: email }, { phoneNumber: phoneNumber }],
    }).then(function (dataArray) {

      dataArray.forEach(function (object) {

        if (object.linkPrecedence == "secondary") {
            id_primary = object.linkedId;
            // id_linked = object.id;
        } else {
            id_primary = object._id;
        }

      });
    });
if (id_primary)
{
    await Contact.find({ $or : [{ linkedId : id_primary}, {_id: id_primary}]
    //   $or: [{ email: comprehensive_emails }, { phoneNumber: comprehensive_numbers }],
    }).then(function (dataArray) {
        // console.log(id_linked, id_primary);
      dataArray.forEach(function (object) {

        if (!comprehensive_emails.includes(object.email) ) {
          comprehensive_emails.push(object.email);
        };
        if (!comprehensive_numbers.includes(object.phoneNumber)) {
          comprehensive_numbers.push(object.phoneNumber);
        };

        if (object.linkPrecedence === "secondary") {
          secondaryIdArray.push(object._id);
          id_primary = object.linkedId;
        }
        else {
          id_primary = object._id;
        };

      });

    });
  }
  }, 1000);

setTimeout(() => {
  res.send({
  "contact":{
    "primaryContatctId": id_primary,
    "emails": comprehensive_emails,
    "phoneNumbers": comprehensive_numbers,
    "secondaryContactIds": secondaryIdArray,
  } })}, 2000);
});

async function Create(email, phoneNumber) {
  await Contact.find({ $and: [{ email: email }, { phoneNumber: phoneNumber }] })
    .then(async function (data) {
      // ----------------------------------------------------- duplication -------
      if (data.length != 0) {
      } // data exists so do nothing

      //-------------------------------------------------------- new entry --------
      else {
        console.log("in main else");

        // finding primary id

        var idtobekeptprimary = null;
        await Contact.find({ $or: [{ email: email }, { phoneNumber: phoneNumber }] })
          .sort({ createdAt: 1 })
          .then((data) => {
            if (data.length != 0) {
                if(data[0].linkedId == null) {idtobekeptprimary = data[0]._id}
              else {idtobekeptprimary = data[0].linkedId; }   };
          });


        // Updating primary account into secondary ones
        if (allEmails.includes(email) && allnumbers.includes(phoneNumber)) {
          console.log("in if");
          await Contact.updateMany(
            {
              $and: [
                { $or: [{ email: email }, { phoneNumber: phoneNumber }] },
                { _id: { $ne: idtobekeptprimary } },
              ],
            },
            { linkPrecedence: "secondary", linkedId: idtobekeptprimary }
          );
        }


        // creating new account as secondary account
        else if (
          allEmails.includes(email) ||
          allnumbers.includes(phoneNumber)
        ) {
          console.log("in else if");
          SAVE(
            (email = email),
            (number = phoneNumber),
            (linkPrecedence = "secondary"),
            (linkedId = idtobekeptprimary),
            (_id = countID)
          );
        }


        //creating new account as primary account
        else {
          console.log("in else");
          SAVE(
            (email = email),
            (number = phoneNumber),
            (linkPrecedence = "primary"),
            (linkedId = null),
            (_id = countID)
          );
        }
      }
    });
};



app.listen(3000 || process.env.PORT, function () {
  console.log("Server started on port 3000.");
});
