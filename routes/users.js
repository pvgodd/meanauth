/*const express = require('express');
const router = express.Router();

// User root
router.get('/', (req, res, next) => {
    res.send('<h1>Users ROOT</h1>');
})

// Regiser
router.get('/register', (req, res, next) => {
    res.send('<h1>사용자 등록</h1>');

})

//login
router.get('/login',(req,res,next) =>{
    res.send('<h1>로그인</h1>');
})

// Profile
router.get('/profile', (req, res, next) =>{
    res.send('<h1>프로필</h1>');
})

module.exports = router;
*/
const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Card = require("../models/card");
const config = require("../config/database");
// Register
router.post("/register", (req, res, next) => {
  let newUser = new User({
    name: req.body.name,
    email: req.body.email,
    username: req.body.username,
    password: req.body.password,
  });

  User.getUserByUsername(newUser.username, (err, user) => {
    if (err) throw err;
    if (user) {
      return res.json({
        success: false,
        msg: "Faile to user Change username plz",
      });
    } else {
      User.addUser(newUser, (err, user) => {
        if (err) {
          res.json({ success: false, msg: "Failed to register user" });
        } else {
          res.json({ success: true, msg: "User registered" });
        }
      });
    }
  });
});
// 사용자 로그인 및 jWT 발급
router.post("/authenticate", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;
  User.getUserByUsername(username, (err, user) => {
    if (err) throw err;
    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
        let tokenUser = {
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
        };
        const token = jwt.sign({ data: tokenUser }, config.secret, {
          expiresIn: 604800, // 1 week
        });
        res.json({
          success: true,
          token: token,
          userNoPW: tokenUser,
        });
      } else {
        return res.json({
          success: false,
          msg: "Wrong password. not password match",
        });
      }
    });
  });
});
// 3. Profile 페이지 요청, JWT 인증 이용
router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    res.json({
      user: {
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
      },
    });
  }
);
router.get(
  "/list",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    User.getAll((err, users) => {
      if (err) throw err;
      res.json(users);
    });
  }
);

// 4. 명함등록
router.post("/card", (req, res, next) => {
  let username = req.body.username;
  let update = {
    name: req.body.name,
    org: req.body.org,
    title: req.body.title,
    tel: req.body.tel,
    fax: req.body.fax,
    mobile: req.body.mobile,
    email: req.body.email,
    homepage: req.body.homepage,
    address: req.body.address,
    zip: req.body.zip,
  };

  Card.getCardByUsername(username, (err, card) => {
    if (err) throw err;
    if (card) {
      Card.updateCard(username, update, (err, card) => {
        return res.json({
          success: true,
          msg: "명함정보업데이트성공",
        });
      });
    } else {
      update.username = req.body.username;
      let newCard = new Card(update);
      Card.addCard(newCard, (err, card) => {
        if (err) throw err;
        if (card) {
          res.json({
            success: true,
            msg: "명함등록성공",
          });
        } else {
          res.json({
            success: false,
            msg: "명함등록실패",
          });
        }
      });
    }
  });
});

// 6.내 명함정보전송
router.post("/myCard", (req, res, next) => {
  Card.getCardByUsername(req.body.username, (err, card) => {
    if (err) throw err;
    if (card) {
      return res.json({
        success: true,
        card: JSON.stringify(card),
      });
    } else {
      res.json({ success: false, msg: "명함정보가없습니다" });
    }
  });
});

module.exports = router;
