ListPhoneNumber = new Meteor.Collection('listPhoneNumber');

if (Meteor.isClient) {
  Meteor.subscribe("listPhoneNumber");
   Session.set('agentType',"All");
  // Returns an event map key for attaching "ok/cancel" event to a text input (given by selector)
  var okcancel_events = function(selector){
    return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
  };

  //Creates an event handler for interpreting "escape","return" and "blur"
  //on a text field and calling "ok" or "cancel" callbacks.
  var make_okcancel_handler = function(options){
    var ok = options.ok || function(){};
    var cancel = options.cancel || function(){};
    return function(evt){
      if (evt.type === "keydown" && evt.which === 27) {
        cancel.call(this,evt);
      }else if (evt.type === "keyup" && evt.which === 13) {
        var value = String(evt.target.value || "");
        if (value) {
          ok.call(this,value,evt);
        }else{
          cancel.call(this,evt);
        }
      }
    };
  };

  //Template for inputPhoneNumber
  Template.inputPhoneNumber.events ={};

  Template.inputPhoneNumber.events[okcancel_events('#phoneNumberBox')] = make_okcancel_handler({
    ok: function(text,event){

      var agentType = "";

      var pattern = new RegExp("[0][19][01234678][0-9]{6,8}");
      if (!pattern.test(text)) {
        alert("Invalid phoneNumber,Please check the phone number again!");
        return false;
      }

      var patternViettel = new RegExp("[0]([9][678]|[1][6][3-9])[0-9]{6,8}");
      var patternVinaphone = new RegExp("[0]([9][14]|[1][2][34579])[0-9]{6,8}");
      var patternMobifone = new RegExp("[0]([9][03]|[1][2][01268])[0-9]{6,8}");

      if (patternViettel.test(text)) {
        agentType = "Viettel";
      }else if (patternVinaphone.test(text)) {
        agentType = "Vinaphone";
      }else if (patternMobifone.test(text)) {
        agentType = "Mobifone";
      }else{
        var str3 = text.substring(0,3);
        var str4 = text.substring(0,4);
        alert("The Agent" + str3 + "or" + str4 + "is not existed");
        return false;
      }

    if (ListPhoneNumber.find({phoneNumber:text}).count() ===0) {
      Meteor.call("addPhoneNumber",text,agentType)
      event.target.value = "";
    }else{
      alert("this number already existed,Please enter another number!");
    }
    }
  });
  
  Template.agent.events({
    'change .agent':function(evt,tmpl){
      var agentType = tmpl.find('.agent').value;
      Session.set('agentType',agentType);
    }
  });

  Template.listPhoneNumber.listPhoneNumber = function(){
    var agentType = Session.get('agentType');
    if (agentType === "All") {
      return ListPhoneNumber.find({isSent: false},{sort:{updatedAt: -1}});
    }else{
      return ListPhoneNumber.find({isSent: false,agent:agentType},{sort:{updatedAt: -1}});
    } 
  };

  Template.listPhoneNumber.events = {
    "dblclick .notYetSent": function(){
      if (confirm("Would you like to remove to Sent")){
        Meteor.call("moveToSent",this._id);
      }
    }
  };

  Template.listPhoneNumberAreSent.listPhoneNumberAreSent = function(){
    var agentType = Session.get('agentType');
    if (agentType === "All") {
      return ListPhoneNumber.find({isSent: true},{sort:{updatedAt: -1}});
    }else{
      return ListPhoneNumber.find({isSent: true,agent:agentType},{sort:{updatedAt: -1}});
    }
  };

  Template.listPhoneNumberAreSent.events = {
      "dblclick .isSent": function(){
        if (confirm("Would you like to remove to Not Yet Sent")){
          Meteor.call("moveToNotYetSent",this._id);
        }
      }
  };

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

}

// Implement all the methods
Meteor.methods({
  addPhoneNumber: function(text,agentType){
    if (!Meteor.userId()) {
      throw new Meteor.Error("not authorized");
    }

      ListPhoneNumber.insert({
        phoneNumber: text,
        isSent: false,
        agent: agentType,
        owner: Meteor.userId(),
        username: Meteor.user().username,
        createdAt: new Date(),
        updatedAt: new Date()
      })
  },
  moveToSent: function(id){
    ListPhoneNumber.update({_id:id},{$set:{isSent: true,updatedAt: new Date()}});
  },
  moveToNotYetSent: function(id){
    ListPhoneNumber.update({_id:id},{$set:{isSent: false,updatedAt: new Date()}});
  }

});

if (Meteor.isServer) {
  Meteor.publish("listPhoneNumber",function(){
    return ListPhoneNumber.find({ owner: this.userId });
  });
  
  Meteor.startup(function () {
    
  });
}
