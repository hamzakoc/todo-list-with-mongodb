const express = require("express");
const https = require("https");
const request = require("request");
const mongoose = require("mongoose");
const _ = require("lodash");
const bodyParser = require("body-parser")
const date = require(__dirname + "/date.js")


let app = express();
app.set("view engine", "ejs")
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://admin:admin123@cluster0.b1201.mongodb.net/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true });


const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Opps! Can not be empty"]
    },

})


const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
    name: "Welcome to your to do list"
})

const item2 = new Item({
    name: "Hit the + button to add a new item"
})

const item3 = new Item({
    name: "Hit this to delete an item"
})


const defaultItems = [item1, item2, item3]

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const List = mongoose.model('List', listSchema);


app.get("/", (req, res) => {
    let day = date.getDate();
    var itemsFromDB;
    Item.find({}, function (err, foundItems) {
        if (err) {
            console.log(err)
        } else {
            if (foundItems.length === 0) {
                Item.insertMany(defaultItems, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Successfully saved all the items to the database");
                    }
                })
                res.redirect("/");
            } else {

                res.render("list", { listTitle: day, newListItem: foundItems })
            }

        }
    })
})

app.get("/:customListName", (req, res) => {
    let customListName = _.capitalize(req.params.customListName)


    List.findOne({ name: customListName }, (err, foundList) => {
        if (err) {
            console.log(err);
        } else {
            if (!foundList) {

                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName)

            } else {
                res.render("list", { listTitle: foundList.name, newListItem: foundList.items })

            }

        }
    })

})



app.post("/", (req, res) => {

    const itemName = req.body.newItem
    const listName = req.body.list
    const item = new Item({
        name: itemName
    });


    if (listName == date.getDate()) {
        item.save();
        res.redirect("/");

    } else {
        List.findOne({ name: listName }, (err, foundList) => {
            foundList.items.push(item);
            foundList.save()
            res.redirect("/" + listName);
        })
    }

    //INSERT Single item


})

app.post("/delete", (req, res) => {

    const checkedItemId = req.body.checkbox
    const listName = req.body.listName

    if (listName == date.getDate()) {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Item succesfully deleted")
            }
        });
        res.redirect("/");

    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }, function (err, results) {
            if (!err) {
                res.redirect("/" + listName);
            }
            else {
                console.log(err);
            }
        }
        )
    }


})


const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on ${PORT}`));



