const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcryptjs');

//for GET book request with id
const ObjectId = require('mongodb').ObjectId

const User = mongoose.model('User');
const Comment = mongoose.model('Comment');
const Book = mongoose.model('Book');
const ReadList = mongoose.model('ReadList');
const Unapproved_Book = mongoose.model('Unapproved_Book')


module.exports.searchBooks = async (req, res, next) => {

    var query = {};

    console.log(req.body)

    // pojedinacno se dodaju parametri u zavisnosti od toga sta je korsinik hteo da doda
    // regex sluzi kao LIKE operator za upit
    if (req.body.name) {
        query["name"] = {
            '$regex': req.body.name,
            '$options': 'i'
        };

    }

    if (req.body.author) {
        query["authors"] = {
            '$regex': req.body.author,
            '$options': 'i'
        };
    }

    if (req.body.genre) {
        query["genres"] = req.body.genre;
    }

    let books = await Book.find(query).exec();
    console.log(books);
    if (books.length == 0) {
        res.status(200).json({
            found: false,
            msg: "None of the books fit the criteria"
        })
        return;
    } else {

        res.json({
            found: true,
            books: books
        })
    }



}
module.exports.searchBooksUnapproved = async (req, res, next) => {

    var query = {};

    console.log(req.body)

    // pojedinacno se dodaju parametri u zavisnosti od toga sta je korsinik hteo da doda
    // regex sluzi kao LIKE operator za upit
    if (req.body.name) {
        query["name"] = {
            '$regex': req.body.name,
            '$options': 'i'
        };

    }

    if (req.body.author) {
        query["authors"] = {
            '$regex': req.body.author,
            '$options': 'i'
        };
    }

    if (req.body.genre) {
        query["genres"] = req.body.genre;
    }

    let books = await Unapproved_Book.find(query).exec();
    console.log(books);
    if (books.length == 0) {
        res.status(200).json({
            found: false,
            msg: "None of the books fit the criteria"
        })
        return;
    } else {
        res.json({
            found: true,
            books: books
        })
    }
}



module.exports.getBook = async (req, res, next) => {

    let book = await Book.findOne(ObjectId(req.params.id)).exec();
    res.send(book);
}

module.exports.getLists = async (req, res, next) => {

    // console.log(req.params.id)
    let book_lists = await ReadList.findOne({
        username: req.params.id
    }).exec();

    let finished_reading = book_lists.finished_reading;
    let currently_reading = book_lists.currently_reading;
    let want_to_read = book_lists.want_to_read;
    var finished_reading_ids = [];
    var currently_reading_ids = [];
    var want_to_read_ids = [];

    for (let i = 0; i < finished_reading.length; i++) {
        finished_reading_ids.push(ObjectId(finished_reading[i].book_id))
    }
    for (let i = 0; i < currently_reading.length; i++) {
        currently_reading_ids.push(ObjectId(currently_reading[i].book_id))
    }
    for (let i = 0; i < want_to_read.length; i++) {
        want_to_read_ids.push(ObjectId(want_to_read[i].book_id))
    }

    let finished_books = await Book.find({
        _id: {
            $in: finished_reading_ids
        }
    }).exec();

    let want_to_read_books = await Book.find({
        _id: {
            $in: want_to_read_ids
        }
    }).exec();

    let currently_reading_books = await Book.find({
        _id: {
            $in: currently_reading_ids
        }
    }).exec();

    console.log(currently_reading_books);

    res.json({
        "currently_reading": currently_reading_books,
        "finished_reading": finished_books,
        "want_to_read": want_to_read_books
    });
}

module.exports.createLists = async (req, res, next) => {

    var readList = new ReadList();

    readList.username = req.body.username;
    readList.want_to_read = [];
    readList.currently_reading = [];
    readList.finished_reading = [];

    readList.save((err, doc) => {

        if (!err)
            res.send(doc);
        else {
            if (err.code == 11000) {
                res.status(422).send('Duplicate hm hm found.');
            } else
                return next(err);
        }

    });


}

module.exports.addToPastList = async (req, res, next) => {

    let idk = await ReadList.updateOne({
        username: req.body.username
    }, {
        "$push": {
            finished_reading: {
                book_id: req.body.book_id,
                review: ""
            }
        }
    }).exec();

    console.log(req.body);
    res.send(req.body);

}
module.exports.addToPresentList = async (req, res, next) => {


    let idk = await ReadList.updateOne({
        username: req.body.username
    }, {
        "$push": {
            currently_reading: {
                book_id: req.body.book_id,
                progress: 0
            }
        }
    }).exec();

    console.log(req.body);
    res.send(req.body);


}
module.exports.addToFutureList = async (req, res, next) => {


    let idk = await ReadList.updateOne({
        username: req.body.username
    }, {
        "$push": {
            want_to_read: {
                book_id: req.body.book_id
            }
        }
    }).exec();

    console.log(req.body);
    res.send(req.body);


}
module.exports.getLists2 = async (req, res, next) => {


    //ukoliko zatreba da vrati samo listu _id od knjiga u listi za citanje
    console.log(req.params.id)
    let book_lists = await ReadList.findOne({
        username: req.params.id
    }).exec();

    res.send(book_lists);
}

module.exports.addComment = async (req, res, next) => {

    var comment = new Comment();
    comment.username = req.body.username;
    comment.book_id = ObjectId(req.body.book_id);
    comment.comment = req.body.comment;
    comment.rating = req.body.rating;
    comment.avg_score = req.body.avg_score;

    await Book.updateOne({
        _id: ObjectId(req.body.book_id)
    }, {
        avg_score: req.body.avg_score

    }).exec();

    console.log(comment);

    comment.save((err, doc) => {
        if (!err)
            res.send(doc);
        else {
            if (err.code == 11000) {
                res.status(422).send('Duplicate comment found');
            } else
                return next(err);
        }

    });
}

module.exports.getComments = async (req, res, next) => {

    //console.log("lol")
    let comments = await Comment.find({
        book_id: req.params.id
    }).exec();

    res.send(comments);

}

module.exports.addRating = async (req, res, next) => {


    await Book.updateOne({
        _id: ObjectId(req.body._id)
    }, {
        avg_score: req.body.avg_score

    }).exec();

    //console.log(req.body);
    res.send(req.body);


}