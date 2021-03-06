var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var express = require('express');
var sessionsModule = require("client-sessions");

var app = express();
app.use(express.static('./public'))

var protectedLobbyAndLounge = function(req, res, next) {
    if( 
        (userRole === 'visitor') ||
        (userRole === 'warden') ||
        (userRole === 'guard')
     ) {
        // do something and call next()
        console.log('Access Granted - Vistor or Warden or Guard')
        next()
    } else {
        // send down a forbidden response (status code 403)
        res.status(403).send("Access forbidden");
    }
}

var protectedCafeteria = function(req, res, next) {
    if( 
        (userRole === 'prisoner') ||
        (userRole === 'warden') ||
        (userRole === 'guard')
     ) {
        // do something and call next()
        console.log('Access Granted - Prisoner or Warden or Guard')
        next()
    } else {
        // send down a forbidden response (status code 403)
        res.status(403).send("Access forbidden");
    }
}

var protectedWarden = function(req, res, next) {
    if( 
        (userRole === 'warden')
     ) {
        // do something and call next()
        console.log('Access Granted - Warden')
        next()
    } else {
        // send down a forbidden response (status code 403)
        res.status(403).send("Access forbidden");
    }
}

var protectedEve = function(req, res, next) {
    if( 
        (userRole === 'prisoner' && userName === 'eve') ||
        (userRole === 'warden') ||
        (userRole === 'guard')
     ) {
        // do something and call next()
        console.log('Access Granted - Warden or Guard or Eve')
        next()
    } else {
        // send down a forbidden response (status code 403)
        res.status(403).send("Access forbidden");
    }
}

var protectedMallory = function(req, res, next) {
    if( 
        (userRole === 'prisoner' && userName === 'mallory') ||
        (userRole === 'warden') ||
        (userRole === 'guard')
     ) {
        // do something and call next()
        console.log('Access Granted - Warden or Guard or Mallory')
        next()
    } else {
        // send down a forbidden response (status code 403)
        res.status(403).send("Access forbidden");
    }
}

// app.use(sessionsMiddleware)
app.use(sessionsModule({
    cookieName: 'auth-cookie',  // front-end cookie name
    secret: 'DR@G0N$',        // the encryption password : keep this safe
    requestKey: 'session',    // we can access our sessions at req.session,
    duration: (86400 * 1000) * 7, // one week in milliseconds
    cookie: {
        ephemeral: false,     // when true, cookie expires when browser is closed
        httpOnly: true,       // when true, the cookie is not accesbile via front-end JavaScript
        secure: false         // when true, cookie will only be read when sent over HTTPS
    }
})) // encrypted cookes!

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


/** Database setup **/
mongoose.connect('mongodb://localhost/jail', function(err) {
    if( err ) {
        console.error('Could not connect to the Mongo Jailhouse!');
    } else {
        console.info("Connected to the Jailhouse!");
    }
});

var User = mongoose.model('user', mongoose.Schema({
    username : { type: String, required: true, unique: true },
    password : { type: String, required: true },
    role     : { type: String, required: true }
}));

/*
app.get('/example', protected, function(req, res){ res.send('example'); });

function protected(req, res, next) {
    if( req.session.user.role === 'someRole' ) {
        // do something and call next()
    } else {
        // send down a forbidden response (status code 403)
    }
}
*/


app.get('/', function(req, res){
    res.sendFile('./html/login.html', {root:'./public'});
});
app.get('/jail', function(req, res, next){
    res.sendFile('./html/jail.html', {root:'./public'});
});
    app.get('/lobby', protectedLobbyAndLounge, function(req, res, next){
    res.sendFile('./html/lobby.html', {root:'./public'});
});
app.get('/visitors-lounge', protectedLobbyAndLounge, function(req, res, next){
    res.sendFile('./html/visitors-lounge.html', {root:'./public'});
});
app.get('/cafeteria', protectedCafeteria, function(req, res, next){
    res.sendFile('./html/cafeteria.html', {root:'./public'});
});
app.get('/wardens-office', protectedWarden, function(req, res, next){
    res.sendFile('./html/wardens-office.html', {root:'./public'});
});
app.get('/cell-e', protectedEve, function(req, res, next){
    res.sendFile('./html/cell-e.html', {root:'./public'});
});
app.get('/cell-m', protectedMallory, function(req, res, next){
    res.sendFile('./html/cell-m.html', {root:'./public'});
});

var userRole = ""
var userNamew = ""

app.get('/me', function(req, res){
    User.findOne({_id: req.session.uid}, function(err, user){
        res.send(user)
        userRole = user.role
        userName = user.username
    })
})

app.post('/login', function(req, res) { // form post submission
    console.info('auth.login.payload:', req.body);
    
    User.findOne({ username: req.body.username }, function(err, user) {
        if( err) {
            console.log('MongoDB error:', err);
            res.status(500).send("failed to find user")
        }
        else if( !user ) {
            console.log('No user found!');
            res.status(403).send("<h1>Login failed</h1>");
        } else {
            console.log('auth.login.user', user);
            // at this point, user.password is hashed!
            bcrypt.compare(req.body.password, user.password, function(bcryptErr, matched) {
                // matched will be === true || false
                if( bcryptErr ) {
                    console.error('MongoDB error:', bcryptErr);
                    res.status(500).send("mongodb error");
                } else if ( !matched ) {
                    // forbidden, bad password
                    console.warn('Password did not match!');
                    res.status(403).send("failed to log in");
                } else {
                    req.session.uid = user._id; // this is what keeps our user session on the backend!
                    res.send({ success: 'Login success' }); // send a success message
                }
            });
        }
    });
});        



app.listen(8080)