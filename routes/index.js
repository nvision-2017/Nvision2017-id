const keystone = require('keystone'),
middleware = require('./middleware'),
importRoutes = keystone.importer(__dirname),
User = keystone.list('User');

var randtoken = require('rand-token');

const Mail = require('./mail');

var sendVEmail = Mail.sendVEmail;

const jwt = require('jsonwebtoken');

let tokenSecret = 'varyverysecrettokenithinkso';

// Common Middleware
keystone.pre('routes', middleware.initErrorHandlers);
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);

// Handle 404 errors
keystone.set('404', function (req, res, next) {
    res.notfound();
});

// Handle other errors
keystone.set('500', function (err, req, res, next) {
    var title, message;
    if (err instanceof Error) {
        message = err.message;
        err = err.stack;
    }
    res.err(err, title, message);
});

// Bind Routes
exports = module.exports = function (app) {
    app.get('/signin', (req, res, next)=>{
        var callbackUrl = req.query.url;
        if (!callbackUrl) {
            return res.notfound();
        }
        if (req.user) {
            var tk = jwt.sign({user: req.user}, tokenSecret, {expiresIn: 900});
            return res.redirect(callbackUrl+"?token="+tk);
        }
        var view = new keystone.View(req, res);
        view.render('index', {callbackUrl: callbackUrl});
    });

    app.post('/signin', (req, res)=>{
        keystone.session.signin({
            email: req.body.email,
            password: req.body.password
        }, req, res, user=>{
            if (!user) res.json({status: false, message: 'Invalid credentials'});
            else res.json({status: true, token: jwt.sign({user: req.user}, tokenSecret, {expiresIn: 900})});
        }, err=>{res.json({status: false, message: 'Invalid credentials'});});
    });

    app.post('/signup', (req, res) => {
        var tk = randtoken.generate(64);
        if (!req.body.callbackUrl) {
            return res.json({status: false, message: 'No callback url provided'});
        }
        if (!req.body.name) {
            return res.json({status:false, message: 'Name cannot be empty'});
        }
        var i = req.body.name.indexOf(' ');
        var f,l;
        if (i==-1){
            f = req.body.name;
            l = ''
        }
        else
        {
            f = req.body.name.substr(0, i);
            l = req.body.name.substr(i);
        }
        if(!req.body.password || req.body.password.length < 6) {
            return res.json({status:false, message: 'Password must have atleast 6 characters'});
        }
        if (!req.body.email) {
            return res.json({status:false, message: 'Enter a valid email address'});
        }
        if (!req.body.college) {
            return res.json({status:false, message: 'College name cannot be empty'});
        }
        if (!req.body.phone) {
            return res.json({status:false, message: 'Phone cannot be empty'});
        }
        new User.model({
            name: { first: f, last: l },
            email: req.body.email,
            password: req.body.password,
            college: req.body.college,
            phone: req.body.phone,
            canAccessKeystone: false,
            emailVerified: false,
            verificationToken: tk
        }).save().then((user)=>{
            var token = jwt.sign({token:tk, callbackUrl: req.body.callbackUrl}, tokenSecret, {expiresIn: 900});
            sendVEmail(token, req.body.email);
            keystone.session.signin({
                email: req.body.email,
                password: req.body.password
            }, req, res, (user)=>{
                return res.json({status: true, token: jwt.sign({user: user}, tokenSecret, {expiresIn: 900}), verified: false, message: 'A verification email sent'});
            }, (err) => res.json({status: false, message: "Auth failed"}));
        }, (err)=>{
            res.json({status: false, message: "Use another email"});
        });
    });

    app.get('/verify', (req, res)=>{
        var token = req.query.token;
        if (!token) {
            return res.notfound();
        }
        jwt.verify(token, tokenSecret, function(err, decoded){
            if (err) {
                return res.notfound();
            }
            else {
                User.model.findOne({emailVerified: false, verificationToken: decoded.token}).then(user=>{
                    if (!user) return res.notfound();
                    user.emailVerified = true;
                    user.save().then(usr=>{
                        res.redirect(decoded.callbackUrl);
                    }, e=>{
                        res.redirect(decoded.callbackUrl);
                    });
                }, err=>{
                    res.notfound();
                });
            }
        });
    });

    app.post('/forgotpassword', (req, res)=>{
        var email = req.body.email;
        if (!email) {
            return res.json({status:false, message: 'Email not provided'});
        }
        User.model.findOne({email: email}).then(user=>{
            if (!user) {
                return res.json({status: false, message: 'No user with this email found'});
            }
            var token = jwt.sign({token:'forgot'+user.verificationToken}, tokenSecret, {expiresIn: 900});
            Mail.sendFMail(email, token, `${user.name.first} ${user.name.last}`);
            return res.json({status:true, message: 'Sent an email to reset password'});
        }, err=>{
            return res.json({status:false, message: 'No user with this email found'});
        });
    });

    app.get('/forgot', (req, res)=>{
        var oldtoken = req.query.token;
        if (!oldtoken) {
            return res.notfound();
        }
        jwt.verify(oldtoken, tokenSecret, function(err, decoded){
            if (err) return res.notfound();
            else {
                var token = decoded.token;
                if (token.substr(0, 6) != "forgot") return res.notfound();
                User.model.findOne({verificationToken: token.substr(6)}).then(user=>{
                    if (!user) return res.notfound();
                    res.render('forgot', {user: req.user, token: oldtoken, updates: keystone.get('updatesWeb')});
                }, err=>res.notfound());
            }
        });
    });

    app.post('/forgot', (req, res)=>{
        var token = req.body.token;
        var password = req.body.password;
        if (!token) {
            return res.json({status:false, message: 'No token'});
        }
        if (!password || password.length < 6) {
            return res.json({status:false, message: 'Password should have min 6 characters'});
        }
        jwt.verify(token, tokenSecret, function(err, decoded){
            if (err) return res.json({status: 'Invaid token'});
            else {
                var token = decoded.token;
                console.log(token);
                if (token.substr(0, 6) != "forgot") return res.json({status: 'Invaid token'});
                User.model.findOne({verificationToken: token.substr(6)}).then(user=>{
                    if (!user) return res.json({status:false, message: 'Invalid token'});
                    user.password = password;
                    user.verificationToken = randtoken.generate(64);
                    user.save().then(user=>{
                        res.json({status: true, redirectURL: '/dashboard', message: 'Updated password'});
                    }, err=>{
                        res.json({status: false, message: 'Error'});
                    });
                }, err=>{
                    res.json({status: false, message: 'Invalid token'});
                });
            }
        });
    });

    // app.get('/dashboard', (req, res)=>{
    //     var view = new keystone.View(req, res);
    //     if (!req.user) {
    //         return res.redirect('/signin');
    //     }
    //     if (!req.user.emailVerified) {
    //         return view.render('dashboard', {emailnv:true, user:req.user, updates: keystone.get('updatesWeb')});
    //     }
    //     Registration.model.find({user: req.user._id}).populate('event').exec().then(r=>{
    //         return view.render('dashboard', {reg:r, n:r.length, user:req.user, updates: keystone.get('updatesWeb')});
    //     }, e=>{
    //         return res.redirect('/');
    //     });
    // });

    app.post('/resendemail', (req, res)=>{
        if (!req.user){
            return res.json({status:false, message: 'Auth failed'});
        }
        if (!req.emailVerified) {
        var token = jwt.sign({token:req.user.verificationToken}, tokenSecret, {expiresIn: 900});
            sendVEmail(token, req.user.email);
            return res.json({status:true});
        }
    });
};