import { resolveSoa } from "dns";
import e from 'express';

var Joi = require('joi');
var Account = require('../../../models/account');

exports.register = async (req: any, res: any) => {
    console.log(req.body);
    /* Verify data */
    const schema = Joi.object().keys({
        id: Joi.string().required(),
        name: Joi.string().required(),
        password: Joi.string().required(),
        phoneNumber: Joi.string().required(),
        macAddress: Joi.string().required(),
        gender: Joi.string().required(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
        res.status(400).json({ message: result.error.message });
        return;
    }

    /* Check duplicate */
    let existing = null;
    try {
        existing = await Account.findByID(req.body.id);
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    } 
    if (existing) {
        res.status(409).json({ message: "Duplicated userID" });
        return;
    }

    /* Create account */
    let account = null;
    try {
        account = await Account.register(req.body);
    } catch (e) {
        res.status(500).json({message: e.message});
        return;
    }

    res.status(200).json({ userID: account });
}

exports.login = async (req: any, res: any) => {
    /* Verify data */
    const schema = Joi.object().keys({
        id: Joi.string().required(),
        password: Joi.string().required()
    });
    const result = schema.validate(req.body);
    if (result.error) {
        res.status(400).json({ message: result.error.message });
        return;
    }

    /* Try login */
    const { id, password } = req.body;
    let account = null;
    try {
        account = await Account.findByID(id);
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }

    if (!account || !account.validatePassword(password)) {
        res.status(401).json({ message: "Invalid ID or PW" })
        return;
    }
    res.status(200).json({ userID: account.id, name: account.name })
}
// TODO: delete image file
exports.withdrawal = async (req: any, res: any) => {
    /* Verifiy data */
    const schema = Joi.object().keys({
        id: Joi.string().required(),
        password: Joi.string().required(),
    });
    const result = schema.validate(req.query);
    if (result.error) {
        res.status(400).json({ message: result.error.message });
        return;
    }
    /* Get account */
    let account = null;
    try {
        account = await Account.findByID(req.query.id);
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }
    if (!account) {
        res.status(404).json({ message: "Can't find account" });
        return;
    }

    const password = req.query.password;
    if (!account || !account.validatePassword(password)) {
        res.status(401).json({ message: "Invalid PW" })
        return;
    }

    const remove = await account.withdrawal();
    if (remove.error) {
        res.status(500).json({ message: remove.error });
        return;
    }
    res.status(200).json({ message: true })
    return;
}

exports.findUser = async (req: any, res: any) => {
    /* Verify data */
    const schema = Joi.object().keys({
        macAddress: Joi.string().required()
    });
    const result = schema.validate(req.query);
    if (result.error) {
        res.status(400).json({ message: result.error.message });
        return;
    }

    /* Get account */
    let account = null;
    try {
        account = await Account.findOne({ macAddress: req.query.macAddress });
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }
    if (!account) {
        res.status(404).json({ message: "Can't find account" });
        return;
    }
    // console.log(account)

    res.status(200).json({ userID: account.id, userName: account.name });

}

exports.updateProfile = async (req: any, res: any) => {
    /* Verify data */
    const schema = Joi.object().keys({
        id: Joi.string().required(),
        age: Joi.number().required(),
        region: Joi.string().required(),
        height: Joi.number().required(),
        job: Joi.string().required(),
        hobby: Joi.string().required(),
        smoke: Joi.boolean().required(),
        drink: Joi.boolean().required(),
        school: Joi.string().required(),
        major: Joi.string().required(),
        self_instruction: Joi.string().required()
    });
    console.log(req.body);
    const result = schema.validate(req.body);
    if (result.error) {
        res.status(400).json({ message: result.error.message });
        return;
    }

    /* Get account */
    let account = null;
    try {
        account = await Account.findByID(req.body.id);
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }
    if (!account) {
        res.status(404).json({ message: "Can't find account" });
        return;
    }

    /* Update profile */
    await Account.updateOne(
        { _id: account._id },
        {
            $set: {
                age: req.body.age,
                height: req.body.height,
                region: req.body.region,
                job: req.body.job,
                hobby: req.body.hobby,
                smoke: req.body.smoke,
                drink: req.body.drink,
                self_instruction: req.body.self_instruction,
                school: req.body.school,
                major: req.body.major
            }
        }
    )

    res.status(200).json({ message: true });
}

exports.downloadProfile = async (req: any, res: any) => {
    /* Verify data */
    const schema = Joi.object().keys({
        id: Joi.string().required(),
    });
    const result = schema.validate(req.query);
    if (result.error) {
        res.status(400).json({ message: result.error.message });
        return;
    }

    /* Get account */
    let account = null;
    try {
        account = await Account.findByID(req.query.id);
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }
    if (!account) {
        res.status(404).json({ message: "Can't find account" });
        return;
    }

    res.status(200).json({ 
        userName: account.name,
        age: account.age,
        region: account.region,
        height: account.height,
        job: account.job,
        hobby: account.hobby,
        smoke: account.smoke,
        drink: account.drink,
        self_instruction: account.self_instruction,
        school: account.school,
        major: account.major
    });
}

exports.getLike = async (req: any, res: any) => {
    /* Verify data */
    const schema = Joi.object().keys({
        id: Joi.string().required(),
    });
    const result = schema.validate(req.query);
    if (result.error) {
        res.status(400).json({ message: result.error.message });
        return;
    }

    /* Get account */
    let account = null;
    try {
        account = await Account.findByID(req.query.id);
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }
    if (!account) {
        res.status(404).json({ message: "Can't find account" });
        return;
    }

    let friendNameList = []
    for (let i = 0; i < account.likeList.length; ++i) {
        /* Get friend account */
        let friend = null;
        try {
            friend = await Account.findByID(account.likeList[i]);
        } catch(e) {
            res.status(500).json({ message: e.message });
        }
        if (friend == null) {
            res.status(404).json({ message: "Can't find friend account." })
        }

        friendNameList.push(friend.name);
    }

    res.status(200).json({ 
        friendID: account.likeList,
        friendName: friendNameList,
    });
}

exports.getStar = async (req: any, res: any) => {
    /* Verify data */
    const schema = Joi.object().keys({
        id: Joi.string().required(),
    });
    const result = schema.validate(req.query);
    if (result.error) {
        res.status(400).json({ message: result.error.message });
        return;
    }

    /* Get account */
    let account = null;
    try {
        account = await Account.findByID(req.query.id);
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }
    if (!account) {
        res.status(404).json({ message: "Can't find account" });
        return;
    }

    res.status(200).json({ score: account.score[0] })
}

exports.getTodayProbability = async(req: any, res: any) => {
    /* Verify data */
    const schema = Joi.object().keys({
        id: Joi.string().required(),
    });
    const result = schema.validate(req.query);
    if (result.error) {
        res.status(400).json({ message: result.error.message });
        return;
    }

    /* Get account */
    let account = null;
    try {
        account = await Account.findByID(req.query.id);
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }
    if (!account) {
        res.status(404).json({ message: "Can't find account" });
        return;
    }
    let totalIntimacy = await getAllUserTotalIntimacy()
    let intimacy = await account.getTotalIntimacy();
    res.status(200).json({ probability: intimacy / totalIntimacy * 100 });
}

exports.getMatch = async(req: any, res: any) => {
    /* Verify data */
    const schema = Joi.object().keys({
        id: Joi.string().required(),
    });
    const result = schema.validate(req.query);
    if (result.error) {
        res.status(400).json({ message: result.error.message });
        return;
    }

    /* Get account */
    let account: any = null;
    try {
        account = await Account.findByID(req.query.id);
    } catch (e) {
        res.status(500).json({ message: e.message });
        return;
    }
    if (!account) {
        res.status(404).json({ message: "Can't find account" });
        return;
    }

    let friendIDList: Array<String> = [];
    let friendNameList: Array<String> = [];
    let intimacyScoreList: Array<Number> = [];
    let phoneNumberList: Array<String> = [];

    for (let i = 0; i < account.matchingList.length; ++i) {
        /* Get friend account */
        let friend: any = null;
        try {
            friend = await Account.findOne({ _id: account.matchingList[i] });
        } catch (e) {
            res.status(500).json({ message: e.message });
            return;
        }
        if (!friend) {
            res.status(404).json({ message: "Can't find friend account" });
            return;
        }

        friendIDList.push(friend.id);
        friendNameList.push(friend.name);
        phoneNumberList.push(friend.phoneNumber);
        
        /* Get friend contact info */
        let friends: Array<{
            friendID: any,
            contactInfo: Array<any>
        }> = [];
        try {
            friends = await account.friends.filter(function(object: any) {
                return object.friendID.toString() == <string>friend._id;
            })
        } catch (e) {
            res.status(500).json({ message: e.message });
            return;
        }
        let friendContactInfo = friends[0].contactInfo

        /* Get intimacy score */
        let intimacyScore = 0;
        for (var j = 0; j < friendContactInfo.length; j++) {
            intimacyScore += friendContactInfo[i].intimacyScore;
        }

        intimacyScoreList.push(intimacyScore);
    }

    res.status(200).json({
        friendID: friendIDList,
        friendName: friendNameList,
        intimacyScore: intimacyScoreList,
        phoneNumber: phoneNumberList,
    })
}

async function getAllUserTotalIntimacy() {
    let score = 0;
    let accounts = await Account.find()
    for (let i = 0; i < accounts.length; ++i) {
        score += accounts[i].getTotalIntimacy();
    }
    return score;
}