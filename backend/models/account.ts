import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import crypto from 'crypto';

function hash(password: string) {
    return crypto.createHmac('sha256', <string>process.env.SECRET_KEY)
        .update(password).digest('hex');
}

const Account = new Schema({
    id: String,
    password: String,
    name: String,
    phoneNumber: String,
    friends: [JSON],
    blockList: [String],
    profileImage: String,
    create_date: { type: Date, default: Date.now },
})

Account.statics.findByID = function(id: string) {
    return this.findOne({'id': id}).exec();
}

Account.statics.register = function({ id, password, name, phoneNumber }: any): string {
    const account = new this({
        id: id,
        password: hash(password),
        name: name,
        phoneNumber: phoneNumber,
        friends: [],
        blockList: [],
        profileImage: null
    });
    account.save();
    return id;
}

Account.methods.validatePassword = function(password: string) {
    const hashed = hash(password);
    return this.password === hashed;
}

Account.methods.withdrawal = function() {
    return this.remove();
}


module.exports = mongoose.model("Account", Account);