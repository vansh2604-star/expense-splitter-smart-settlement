import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import prisma from "../config/prisma";
import type { AuthRequest } from "../middleware/auth.middleware";





const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters"),

  email: z
    .string()
    .email("Invalid email address"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const register = async (
  req: Request,
  res: Response,
) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const {
      name,
      email,
      password,
    } = validatedData;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(
      async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
          },
        });

        const wallet = await tx.wallet.create({
          data: {
            userId: newUser.id,
            balance: 1000,
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: 1000,
            type: "INITIAL_CREDIT",
            reason: "Welcome bonus: 1000 Demo Credits",
          },
        });

        return {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          wallet: {
            id: wallet.id,
            balance: wallet.balance,
          },
        };
      },
    );


    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  });
  
  export const login = async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
  
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
        include: {
          wallet: true,
        },
      });
  
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
  
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password,
      );
  
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
  
      const token = jwt.sign(
        {
          userId: user.id,
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: "7d",
        },
      );
  
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
       user: {
  id: user.id,
  name: user.name,
  email: user.email,
  wallet: user.wallet
    ? {
        id: user.wallet.id,
        balance: user.wallet.balance,
      }
    : null,
},
      });
    } catch (error) {
      console.error("Login error:", error);
  
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.issues,
        });
      }
  
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };



  

export const getMe = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.userId,
      },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wallet: user.wallet
          ? {
              id: user.wallet.id,
              balance: user.wallet.balance,
            }
          : null,
      },
      
    });
  } catch (error) {
    console.error("Get me error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const googleLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
});

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { email, name } = googleLoginSchema.parse(req.body);

    let user = await prisma.user.findUnique({
      where: { email },
      include: { wallet: true },
    });

    if (!user) {
      // Auto-register google user with welcome bonus
      const hashedPassword = await bcrypt.hash(`google_${Date.now()}_${Math.random()}`, 10);
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
          },
        });

        const wallet = await tx.wallet.create({
          data: {
            userId: newUser.id,
            balance: 1000,
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: 1000,
            type: "INITIAL_CREDIT",
            reason: "Welcome bonus: 1000 Demo Credits",
          },
        });

        return {
          ...newUser,
          wallet,
        };
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wallet: user.wallet
          ? {
              id: user.wallet.id,
              balance: user.wallet.balance,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};