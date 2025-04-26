const user = require('../models/userModel');
const helperFunctions = require('../utils/generateToken');

exports.googleSignIn = async (userData) => {
  const { email } = userData;
  const userExists = await user.findOne({ where: { email } });

  if (userExists) {
    if (userExists.signUpMethod === 'mail') {
      return {
        code: 403,
        status: false,
        message: 'Your account is associated with email/password. Please sign in using those credentials.',
      };
    }

    if (!userExists.activeStatus) {
      return {
        code: 403,
        status: false,
        message: 'This account is deactivated. Please contact support.',
      };
    }

    return {
      code: 200,
      status: true,
      message: 'User signed in successfully',
      user: userExists,
      token: helperFunctions.generateToken({
        userId: userExists.id,
        email: userExists.email,
      }),
    };
  } else {
    const newUser = await user.create({
      ...userData,
      signUpMethod: 'google',
      password: '',
    });

    return {
      code: 201,
      status: true,
      message: 'User created and signed in successfully',
      user: newUser,
      token: helperFunctions.generateToken({
        userId: newUser.id,
        email: newUser.email,
      }),
    };
  }
};
