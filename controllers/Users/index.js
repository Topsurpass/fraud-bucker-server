import bcrypt from "bcrypt";
import prisma from "../../utils/db.js";
import { validateFields } from "../../utils/helpers.js";
import { sendResetEmail } from "../../utils/mailer.js";
import { v4 as uuidv4 } from "uuid";
import redisStorage from "../../utils/redis.js";
import config from "../../@config/index.js";
export default class UserController {
    /**
     * Register new user
     * @param {Request} req
     * @param {Response} res
     * @returns JSON
     */

    static async getAllUser(req, res) {
        /**
         * Get all users
         */
        try {
            const { page = 1, pageSize = 5, searchText = "" } = req.query;

            const pageNumber = parseInt(page, 10);
            const pageSizeNumber = parseInt(pageSize, 10);

            const skip = (pageNumber - 1) * pageSizeNumber;

            const searchCondition = searchText
                ? {
                      OR: [
                          {
                              firstname: {
                                  contains: searchText,
                              },
                          },
                          {
                              lastname: {
                                  contains: searchText,
                              },
                          },
                          {
                              email: {
                                  contains: searchText,
                              },
                          },
                          {
                              jobTitle: {
                                  contains: searchText,
                              },
                          },
                          {
                              phone: {
                                  contains: searchText,
                              },
                          },
                      ],
                  }
                : {};

            const totalRecords = await prisma.user.count({
                where: searchCondition,
            });

            const users = await prisma.user.findMany({
                where: searchCondition,
                skip,
                take: pageSizeNumber,
            });

            const filteredUsers = users.map(
                ({ password, refreshToken, ...rest }) => rest
            );
            res.status(200).json({
                message: "All users",
                data: filteredUsers,
                pageCount: Math.ceil(totalRecords / pageSizeNumber),
                totalRecords,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving all users.",
            });
        }
    }

    static async getUserById(req, res) {
        /**
         * Get user by Id
         */
        const { id } = req.params;

        try {
            const user = await prisma.user.findFirst({
                where: { id: id },
                include: {
                    transactions: true,
                },
            });
            if (!user) {
                return res.status(404).json({
                    error: "User not found.",
                });
            }
            const { password, refreshToken, ...data } = user;
            res.status(200).json({
                message: "User details",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving the user",
            });
        }
    }

    static async createUser(req, res) {
        /**
         * Create new user
         */
        try {
            const { firstname, lastname, email, phone, jobTitle, role, password } =
                req.body;

            const requiredFields = [
                "firstname",
                "lastname",
                "email",
                "phone",
                "jobTitle",
                "password",
            ];
            if (!validateFields(req, res, requiredFields)) {
                return;
            }

            const existingUser = await prisma.user.findUnique({
                where: { email: email },
            });

            if (existingUser) {
                return res.status(400).json({ error: "Email already exists" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await prisma.user.create({
                data: {
                    firstname,
                    lastname,
                    email,
                    phone,
                    jobTitle,
                    password: hashedPassword,
                    role: role || undefined,
                },
            });
            const { password: newPassword, refreshToken, ...userData } = newUser;
            return res.status(201).json({
                message: "New user created successfully",
                user: userData,
            });
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                error: "An error occurred while creating the user.",
            });
        }
    }

    static async updateUser(req, res) {
        /**
         * Update a particular user using its UUID
         */
        const { id } = req.params;
        const { firstname, lastname, jobTitle, phone, email, password, role } = req.body;
        if (
            !firstname &&
            !lastname &&
            !jobTitle &&
            !phone &&
            !email &&
            !password &&
            !role
        ) {
            return res.status(400).json({ error: "No fields provided for update" });
        }
        const validRoles = ["USER", "ADMIN"];
        const updateData = {};
        if (firstname) updateData.firstname = firstname;
        if (lastname) updateData.lastname = lastname;
        if (jobTitle) updateData.jobTitle = jobTitle;
        if (phone) updateData.phone = phone;
        if (role) {
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    error: "Invalid role. Role can either be 'USER' or 'ADMIN'.",
                });
            }
            updateData.role = role;
        }
        if (email) {
            const existingEmail = await prisma.user.findFirst({
                where: {
                    email: email,
                    id: {
                        not: id,
                    },
                },
            });

            if (existingEmail) {
                return res.status(403).json({
                    error: "User with this email exist",
                });
            }
            updateData.email = email;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }
        try {
            const data = await prisma.user.update({
                where: { id },
                include: {
                    transactionsCreated: true,
                },
                data: updateData,
            });

            const { password, refreshToken, ...userData } = data;

            return res.status(200).json({
                message: "User details updated successfully",
                data: userData,
            });
        } catch (error) {
            console.log(error);
            if (error.code === "P2025") {
                return res.status(404).json({ error: "User not found" });
            }
            return res
                .status(500)
                .json({ error: "An error occurred while updating the user." });
        }
    }

    static async deleteUser(req, res) {
        /**
         * Delete a user using its unique ID
         */
        const { id } = req.params;
        try {
            await prisma.transaction.deleteMany({
                where: {
                    analystId: id,
                    status: {
                        in: ["Fraudulent", "Escalated", "Not fraudulent"],
                    },
                },
            });
            await prisma.user.delete({
                where: { id: id },
            });
            res.status(200).json({
                message: "User deleted successfully",
            });
        } catch (error) {
            console.log(error);
            if (error.code === "P2025") {
                return res.status(404).json({ error: "User not found" });
            }
            return res
                .status(500)
                .json({ error: "An error occurred while deleting the user." });
        }
    }

    static async forgotPasswordRequest(req, res) {
        const { email } = req.body;
        const requiredFields = ["email"];
        if (!validateFields(req, res, requiredFields)) {
            return;
        }
        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                return res
                    .status(404)
                    .json({ error: "User with this email does not exist." });
            }
            const resetToken = uuidv4();
            await redisStorage.savePasscode(email, resetToken);
            const resetUrl = `${config.resetPassword.url}/${resetToken}`;
            await sendResetEmail(user.email, resetUrl);

            res.status(200).json({
                message: "Reset link sent to email",
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while processing the reset request.",
            });
        }
    }

    static async resetPassword(req, res) {
        const { password, passcode } = req.body;

        try {
            const email = await redisStorage.getPasscode(passcode);

            if (!email) {
                return res.status(400).json({
                    error: "Invalid or expired link. Kindly request a new link.",
                });
            }

            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                return res.status(400).json({
                    error: "User not found.",
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    refreshToken: null,
                },
            });

            await redisStorage.deletePasscode(passcode);

            res.status(200).json({ message: "Password reset successfully." });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while resetting the password.",
            });
        }
    }
}
