const Bed = require('../models/BedModel');
const jwt = require('jsonwebtoken');
const moment = require('moment');

exports.createBed = (req, res) => {

    // getting info from the front
    const { bed, floor, available, start, stop } = req.body;

    // creating the info from the front
    const newBed = new Bed({
        bed: bed,
        floor: floor,
        available: available,
        start: start,
        stop: stop
    })

    // saving bed into db
    newBed.save();
    return res.status(200).send(`bed number ${bed} created on the floor ${floor}`)
}

exports.freeBedList = (req, res) => {

    // finding bed from boolean and returning the result
    Bed.find({ available: true }).then((result) => {
        console.log(result)
        return res.status(200).json({ result })
    })
        .catch(err => {
            return res.status(500).send()
        })
}


exports.assignUserBed = (req, res) => {

    const { bedNumber, start, stop } = req.body;

    // checking user info
    const userToken = req.headers['x-auth-token'];
    // checking passphrase
    const userInfo = jwt.verify(userToken, 'AVEC');
    
    // checking entry info and making the best not empty with the user id
    if (bedNumber && start && stop) {
            Bed.findOneAndUpdate({ _id: bedNumber }, { start, stop, available: false, user: userInfo.user._id }, { new: true })
            .then((result) => {
            
                let userIn = moment(result.start).subtract(10, 'days').calendar();
                let userOut = moment(result.stop).subtract(10, 'days').calendar();

                return res.status(200).send(`Vous avez reservé le lit n° ${result.bed} à l'étage ${result.floor} du ${userIn} au ${userOut}`)
            })
        } else {
            return res.status(404).send(" Merci de renseigner tous les champs")
        }
}


exports.unassignUserBed = (req, res) => {

    // retrieving token inf
    const userToken = req.headers['x-auth-token'];
    // verify token
    const userInfo = jwt.verify(userToken, 'AVEC');
    // getting the user id from the bed
    const userBed = userInfo.user._id;
    // storing the bed number
    const { bedNumber } = req.body;

    // and then updating the bed, deleting the user id from it and make it available
    Bed.findOneAndUpdate({ user : userBed}, { start: null, stop: null, available: true, user: null}, {new: true})
        .then((result) => {
            return res.status(200).send(`le lit ${result.bed} à l'étage ${result.floor} est de nouveau disponible`)
        })
}

exports.searchBedByFloor = (req, res) => {

    // getting the floor for the research
    const { floor } = req.params;

    // sending the result of all available beds
    Bed.find({floor : floor, available: true})
    .then((result) => {
        return res.status(200).json({result})
    })

}

exports.searchUserBed = (req, res) => {

    // getting user infos
    const userToken = req.headers['x-auth-token'];
    const userInfo = jwt.verify(userToken, 'AVEC');
    const userBed = userInfo.user._id;

    // finding the bed regarding the user info
    Bed.findOne({ user : userBed })
        .then((result) => {
            return res.status(200).json(`Votre lit porte le numéro: ${result.bed} à l'étage ${result.floor}`)
        })
        .catch(e => {
            return res.status(409).send("Vous n'avez pas reservé de lit")
        })

}