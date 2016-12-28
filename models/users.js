let keystone = require('keystone');
let Types = keystone.Field.Types;

let autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(keystone.mongoose);

let User = new keystone.List('User', {
    nodelete: true
});

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

User.add({
    name: { type: Types.Name, required: true, index: true },
    userid: {type: Types.Number, noedit: true, unique: true},
    email: { type: Types.Email, initial: true, required: true, index: true, unique: true, noedit: false },
    password: { type: Types.Password, required: true, initial: true },
    college: {type: Types.Text, initial: true},
    phone: {type: Types.Number, initial:true},
    canAccessKeystone: { type: Boolean, initial: true },
    emailVerified: {type:Boolean, initial: false, noedit: true},
    verificationToken: {type: Types.Text, initial: false, noedit: true}
});

User.schema.plugin(autoIncrement.plugin, {model: 'User', field: 'userid'});

User.schema.virtual('nvisionID').get(function(){
    return 'IITH17'+pad(this.userid,4);
});

User.defaultColumns = 'name, email, college, phone';

User.register();