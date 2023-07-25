app.post("/identify", function (req, res) {




  const email = req.body.email;
  const phoneNumber = req.body.phoneNumber;

  const emailsArray = [];
  const numbersArray = [];
  const secondaryIdArray = [];
  var id_primary = NaN;

  Contact.find({email:email} || {phoneNumber:phoneNumber}).then(function (dataArray) {

    if (dataArray) {
          dataArray.forEach(function (object){
          if (object.email) {emailsArray.push(object.email)};
          if (object.phoneNumber) {emailsArray.push(object.phoneNumber)};
          if (object.linkPrecedence == "secondary") { secondaryIdArray.push(object.id);}
           else {id_primary = object.id};
          });
        }


        else if (    (!emailsArray.include(email) && email != null)   || (!numbersArray.include(phoneNumber) && phoneNumber != null)   )
              {
                  const newContact = new Contact ({email: email, phoneNumber:phoneNumber, linkPrecedence:"secondary", linkedId:id_primary});
                  newContact.save();
                }

                    else {
                        const newContact = new Contact ({email: email, phoneNumber:phoneNumber, linkPrecedence:"primary"});
                        newContact.save();
                        res.redirect("/identify");

      };

      res.send(JSON.stringify({"contact":
                                {"primaryContatctId":id_primary,
                              "emails": emailsArray,
                            "phoneNumbers": numbersArray,
                          "secondaryContactIds": secondaryIdArray}
                        })
                      );



  });








});
