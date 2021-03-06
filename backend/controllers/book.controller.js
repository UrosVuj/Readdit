const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcryptjs');

//for GET book request with id
const ObjectId = require('mongodb').ObjectId

const User = mongoose.model('User');

const Genre = mongoose.model('Genres');
const Comment = mongoose.model('Comment');
const Book = mongoose.model('Book');
const ReadList = mongoose.model('ReadList');
const Unapproved_Book = mongoose.model('Unapproved_Book')
const BookProgress = mongoose.model('BookProgress')


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
    if (book != null)
        res.send(book);
    else {
        let unap_book = await Unapproved_Book.findOne(ObjectId(req.params.id)).exec();
        res.send(unap_book)
    }
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
module.exports.removeFromList = async (req, res, next) => {

    console.log(req.body.type_to_update);

    if (req.body.type_to_update == 'currently_reading')
        await ReadList.updateOne({
            username: req.body.username
        }, {
            "$pull": {
                currently_reading: {
                    book_id: req.body.book_id
                }
            }
        }).exec();

    else {

        await ReadList.updateOne({
            username: req.body.username
        }, {
            "$pull": {
                want_to_read: {
                    book_id: req.body.book_id
                }
            }
        }).exec();
    }
    res.json({
        msg: "Success!"
    })
}

module.exports.setProgress = async (req, res, next) => {


    let result = await ReadList.updateOne({
        'currently_reading.book_id': req.body.book_id,
        username: req.body.username
    }, {
        '$set': {
            'currently_reading.$.book_id': req.body.book_id,
            'currently_reading.$.progress': req.body.progress
        }
    }).exec();


    console.log(req.body);
    res.json({
        msg: "Success!"
    });


}

//bas kako stoje u bazi
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

module.exports.updateBook = async (req, res, next) => {

    if (req.body.approved == true) {
        let book = await Book.findOne({
            _id: ObjectId(req.body._id)
        })

        console.log(req.body.type_to_update)
        switch (req.body.type_to_update) {
            case "name":
                console.log("Update email")
                await Book.updateOne({
                    _id: ObjectId(req.body._id)
                }, {
                    name: req.body.name
                }).exec();
                break;
            case "authors":
                console.log("Update dob")
                await Book.updateOne({
                    _id: ObjectId(req.body._id)
                }, {
                    authors: req.body.authors
                }).exec();
                break;
            case "description":
                await Book.updateOne({
                    _id: ObjectId(req.body._id)
                }, {
                    description: req.body.description
                }).exec();
                break;
            case "genres":
                await Genre.updateMany({
                    name: {
                        $in: book.genres
                    }
                }, {
                    $inc: {
                        "num_of_books": -1
                    }
                }).exec();
                await Genre.updateMany({
                    name: {
                        $in: req.body.genres
                    }
                }, {
                    $inc: {
                        "num_of_books": 1
                    }
                }).exec();

                await Book.updateOne({
                    _id: ObjectId(req.body._id)
                }, {
                    genres: req.body.genres
                }).exec();
                break;
            case "date_of_publishing":
                await Book.updateOne({
                    _id: ObjectId(req.body._id)
                }, {
                    date_of_publishing: req.body.date_of_publishing
                }).exec();
                break;

        }
    } else {
        let book = await Unapproved_Book.findOne({
            _id: ObjectId(req.body._id)
        })

        switch (req.body.type_to_update) {
            case "name":
                await Unapproved_Book.updateOne({
                    _id: ObjectId(req.body._id)
                }, {
                    name: req.body.name
                }).exec();
                break;
            case "authors":
                await Unapproved_Book.updateOne({
                    _id: ObjectId(req.body._id)
                }, {
                    authors: req.body.authors
                }).exec();
                break;
            case "description":
                await Unapproved_Book.updateOne({
                    _id: ObjectId(req.body._id)
                }, {
                    description: req.body.description
                }).exec();
                break;
            case "genres":
                await Unapproved_Book.updateOne({
                    _id: ObjectId(req.body._id)
                }, {
                    genres: req.body.genres
                }).exec();
                break;
            case "date_of_publishing":
                await Unapproved_Book.updateOne({
                    _id: ObjectId(req.body._id)
                }, {
                    date_of_publishing: req.body.date_of_publishing
                }).exec();
                break;

        }
    }



    //console.log(req.body);
    res.send(req.body);


}

module.exports.createBookPages = async (req, res, next) => {



    bookProgress = new BookProgress()
    bookProgress.book_id = req.body.book_id;
    bookProgress.username = req.body.username;
    bookProgress.book_pages = 100;

    bookProgress.save();

    console.log(req.body);
    res.send(req.body);

}

module.exports.updateBookPages = async (req, res, next) => {


    let respon = await BookProgress.updateOne({
        username: req.body.username,
        book_id: req.body.book_id,
    }, {
        book_pages: req.body.book_pages
    }).exec();


    res.send(respon);

}

module.exports.getBookPages = async (req, res, next) => {

    let respon = await BookProgress.findOne({
        username: req.params.username,
        book_id: req.params.book_id,
    }).exec();


    res.send(respon);

}

module.exports.deleteBookPages = async (req, res, next) => {


    let respon = await BookProgress.deleteOne({
        username: req.body.username,
        book_id: req.body.book_id,
    }).exec();


    res.send(respon);

}