import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middleware/auth.middleware';

const authService = new AuthService();
const userService = new UserService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);

    // Set HttpOnly cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const refreshToken = req.cookies?.refreshToken;

    if (userId && refreshToken) {
      await authService.logout(userId, refreshToken);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Attempt to decode user ID from old access token (even if expired) or require it in body/cookie
    // A better way is to store userId in the refreshToken cache or read from token payload
    const oldRefreshToken = req.cookies?.refreshToken;
    const oldAccessToken = req.cookies?.accessToken;
    
    if (!oldRefreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    // Decode without verifying to get userId
    import('jsonwebtoken').then(jwt => {
      const decoded = jwt.decode(oldAccessToken) as any;
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Invalid tokens' });
      }

      authService.refreshTokens(decoded.id, oldRefreshToken)
        .then(({ accessToken, refreshToken }) => {
          res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
          });

          res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          res.status(200).json({ status: 'success', message: 'Tokens refreshed' });
        })
        .catch(next);
    });
  } catch (error) {
    next(error);
  }
};
