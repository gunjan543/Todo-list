const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _ =require("lodash");

const date=require(__dirname+"/date.js");

const app=express();

app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

//database connection
mongoose.connect("mongodb+srv://admin-gunjan:Gunjan@12345@cluster0.xasqw.mongodb.net/todolistDB",{useNewUrlParser:true});
//schema
const itemsSchema={
  name:String
};
//mongoose model
const Item = mongoose.model("item",itemsSchema);
//mongoose document
const item1=new Item({
  name:"Welcome to your todolist!"
});
const item2=new Item({
  name:"Hit the + button to add a new item."
});
const item3=new Item({
  name:"<-- Hit this to delete an item."
});
//putting into array
const defaultItems=[item1,item2,item3];
//schema for dynamic routing
const listSchema={
  name:String,
  items:[itemsSchema]
};
//mongoose model for dynamic routing
const List=mongoose.model("List",listSchema);

app.get("/",function(req,res) {
   let day=date.getDate();
   //mongoose find
   Item.find({},function(err,foundItems) {
     if(foundItems.length === 0){
       //then only we will insert default data
       //insert Many
       Item.insertMany(defaultItems,function functionName(err) {
         if(err){
           console.log(err);
         }
         else{
           console.log("Success");
         }
       });
       res.redirect("/");
     }else{
      res.render("list",{listTitle: day,newListItems:foundItems});
    }
   });

});
app.get("/:customListName",function(req,res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList) {
    if(!err){
      if(!foundList){
        //create a new list
          const list=new List({
          name:customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
        else{
          //show an existing lists
          res.render("list",{listTitle: foundList.name, newListItems:foundList.items});
        }
      }
    });

});

app.post("/",function(req,res) {
  const itemName=req.body.newItem;
  const listName=req.body.list;
  //creating new document
  const item=new Item({
    name:itemName
  });
  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName},function (err,foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});

app.post("/delete",function(req,res) {
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;
  //remove the item
  if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId,function (err) {
      if(!err){
        console.log("Successfully deleted");
        res.redirect("/");
      }
    });
  }
else{
  List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList) {
    if(!err){
      res.redirect("/"+listName);
    }
  });
}
});

let port=process.env.PORT;
if(port==null || port==""){
  port=3000;
}
app.listen(port,function() {
  console.log("Server started");
});
