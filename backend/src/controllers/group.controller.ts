import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    const group = await prisma.$transaction(async (tx) => {
      // Create group
      const newGroup = await tx.group.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          createdById: userId,
        },
      });

      // Automatically add creator as first member
      await tx.groupMember.create({
        data: {
          userId,
          groupId: newGroup.id,
        },
      });

      return newGroup;
    });

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    console.error("Create group error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addGroupMember = async (req: Request, res: Response) => {
    try {
        const groupIdParam = req.params.groupId;

        const groupId = Array.isArray(groupIdParam)
          ? groupIdParam[0]
          : groupIdParam;
        
        const { email } = req.body;
        const userId = req.userId;
        
        if (!groupId) {
          return res.status(400).json({
            success: false,
            message: "Invalid group ID",
          });
        }


  
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
  
      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Member email is required",
        });
      }
  
      // Check if group exists
      const group = await prisma.group.findUnique({
        where: {
          id: groupId,
        },
      });
  
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }
  
      // Check whether requesting user belongs to this group
      const requestingMember = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });
  
      if (!requestingMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }
  
      // Find user to add
      const userToAdd = await prisma.user.findUnique({
        where: {
          email: email.trim(),
        },
      });
  
      if (!userToAdd) {
        return res.status(404).json({
          success: false,
          message: "User with this email does not exist",
        });
      }
  
      // Check if already a member
      const existingMember = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId: userToAdd.id,
            groupId,
          },
        },
      });
  
      if (existingMember) {
        return res.status(409).json({
          success: false,
          message: "User is already a member of this group",
        });
      }
  
      // Add member
      const member = await prisma.groupMember.create({
        data: {
          userId: userToAdd.id,
          groupId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
  
      return res.status(201).json({
        success: true,
        message: "Member added successfully",
        member,
      });
    } catch (error) {
      console.error("Add group member error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

export const getMyGroups = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const memberships = await prisma.groupMember.findMany({
      where: {
        userId,
      },
      include: {
        group: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const groups = memberships.map((membership) => membership.group);

    return res.status(200).json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error("Get my groups error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




export const getGroupDetails = async (
    req: Request,
    res: Response
  ) => {
    try {
      const groupIdParam = req.params.groupId;
  
      const groupId = Array.isArray(groupIdParam)
        ? groupIdParam[0]
        : groupIdParam;
  
      const userId = req.userId;
  
      // Authentication check
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
  
      // Validate group ID
      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: "Group ID is required",
        });
      }
  
      // Check if user belongs to the group
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId,
          },
        },
      });
  
      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }
  
      // Get complete group details
      const group = await prisma.group.findUnique({
        where: {
          id: groupId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
  
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              joinedAt: "asc",
            },
          },
  
          expenses: {
            include: {
              paidBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
  
              splits: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
  
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
  
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        group,
      });
    } catch (error) {
      console.error("Get group details error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };

  