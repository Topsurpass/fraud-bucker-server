import prisma from "../../utils/db.js";
import { validateFields } from "../../utils/helpers.js";
import validator from "validator";

export default class FraudContactController {
    /**
     * Register new Fraud contact
     * @param {Request} req
     * @param {Response} res
     * @returns JSON
     */
    static async getAllContact(req, res) {
        try {
            const { page = 1, pageSize = 5, searchText = "" } = req.query;

            const pageNumber = parseInt(page, 10);
            const pageSizeNumber = parseInt(pageSize, 10);

            const skip = (pageNumber - 1) * pageSizeNumber;

            const searchCondition = searchText
                ? {
                      OR: [
                          {
                              merchant: {
                                  name: { contains: searchText },
                              },
                          },
                          {
                              email: {
                                  contains: searchText,
                              },
                          },
                          {
                              phone: {
                                  contains: searchText,
                              },
                          },
                          {
                              name: {
                                  contains: searchText,
                              },
                          },
                      ],
                  }
                : {};

            const totalRecords = await prisma.fraudContact.count({
                where: searchCondition,
            });
            const data = await prisma.fraudContact.findMany({
                where: searchCondition,
                include: { merchant: true, createdBy: true },
                skip,
                take: pageSizeNumber,
            });
            const sanitizedData = data.map((contact) => {
                const {
                    createdBy: { password, refreshToken, ...sanitizedUser } = {},
                    ...rest
                } = contact;

                return {
                    ...rest,
                    createdBy: sanitizedUser,
                };
            });
            return res.status(200).json({
                message: "All frauddesk contact details",
                data: sanitizedData,
                pageCount: Math.ceil(totalRecords / pageSizeNumber),
                totalRecords,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving the frauddesk contacts.",
            });
        }
    }

    static async getContactById(req, res) {
        /**
         * Get frauddesk contact by Id
         */

        const { id } = req.params;

        try {
            const data = await prisma.fraudContact.findFirst({
                where: { id: id },
                include: {
                    merchant: true,
                    createdBy: true,
                },
            });
            if (!data) {
                return res
                    .status(404)
                    .json({ error: "Frauddesk contact details not found" });
            }
            const {
                createdBy: { password, refreshToken, ...sanitizedUser } = {},
                ...rest
            } = data;

            const sanitizedData = {
                ...rest,
                createdBy: sanitizedUser,
            };

            return res.status(200).json({
                message: "Frauddesk contact details",
                data: sanitizedData,
            });
        } catch (error) {
            res.status(500).json({
                erorr: "An error occurred while retrieving the user details.",
            });
        }
    }

    static async createContact(req, res) {
        /**
         * Create or add a new fraud contact to the DB
         */
        const { id } = req.user;
        const { merchantId, name, phone, email } = req.body;
        const requiredFields = ["merchantId", "name", "phone", "email"];

        if (!validateFields(req, res, requiredFields)) {
            return;
        }

        if (!phone || !validator.isMobilePhone(phone, "any")) {
            return res.status(400).json({ error: "Invalid phone number" });
        }

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ error: "Invalid email address" });
        }

        try {
            const merchantData = await prisma.merchant.findFirst({
                where: {
                    id: merchantId,
                },
            });

            if (!merchantData) {
                return res.status(404).json({
                    error: "Merchant with the provided merchant ID does not exist.",
                });
            }
            const analystData = await prisma.fraudContact.findFirst({
                where: {
                    email: email,
                },
            });

            if (analystData) {
                return res.status(404).json({
                    error: "Fraud analyst with the provided email already exist.",
                });
            }
            const fraudContact = await prisma.fraudContact.create({
                data: {
                    merchant: {
                        connect: {
                            id: merchantId,
                        },
                    },
                    createdBy: {
                        connect: {
                            id: id,
                        },
                    },
                    name,
                    phone,
                    email,
                },
                include: {
                    merchant: true,
                    createdBy: true,
                },
            });

            const {
                createdBy: { password, refreshToken, ...sanitizedUser } = {},
                ...rest
            } = fraudContact;

            const sanitizedData = {
                ...rest,
                createdBy: sanitizedUser,
            };

            res.status(201).json({
                message: "New frauddesk contact added",
                data: sanitizedData,
            });
        } catch (error) {
            res.status(500).json({
                error: "An error occurred while adding the fraud contact",
            });
        }
    }

    static async updateContact(req, res) {
        /**
         * Update a particular Frauddesk contact's details using its UUID
         */
        const { id } = req.params;
        const { merchantId, name, phone, email } = req.body;

        if (!merchantId && !name && !phone && !email) {
            return res.status(400).json({ error: "No fields provided for update" });
        }

        const updateData = {};
        if (merchantId) {
            const merchantData = await prisma.merchant.findFirst({
                where: { id: merchantId },
            });

            if (!merchantData) {
                return res.status(404).json({
                    error: "Merchant with the provided merchant ID does not exist.",
                });
            }
            updateData.merchantId = merchantId;
        }

        if (name) updateData.name = name;

        if (phone) {
            if (!validator.isMobilePhone(phone, "any")) {
                return res.status(400).json({ error: "Invalid phone number" });
            }

            updateData.phone = phone;
        }
        if (email) {
            if (!validator.isEmail(email)) {
                return res.status(400).json({ error: "Invalid email address" });
            }
            const existingEmail = await prisma.fraudContact.findFirst({
                where: {
                    email: email,
                    id: {
                        not: id,
                    },
                },
            });

            if (existingEmail) {
                return res.status(403).json({
                    error: "Email already exist",
                });
            }
            updateData.email = email;
        }

        try {
            const updatedContact = await prisma.fraudContact.update({
                where: { id: id },
                include: {
                    merchant: true,
                    createdBy: true,
                },
                data: updateData,
            });
            const {
                createdBy: { password, refreshToken, ...sanitizedUser } = {},
                ...rest
            } = updatedContact;

            const sanitizedData = {
                ...rest,
                createdBy: sanitizedUser,
            };
            res.status(200).json({
                message: "Frauddesk contact details updated successfully",
                data: sanitizedData,
            });
        } catch (error) {
            if (error.code === "P2025") {
                return res
                    .status(404)
                    .json({ error: "Frauddesk contact details not found" });
            }
            res.status(500).json({
                error: "An error occurred while updating the contact details",
            });
        }
    }

    static async deleteContact(req, res) {
        /**
         * Delete a fraud contact details using its unique ID
         */
        const { id } = req.params;
        try {
            const data = await prisma.fraudContact.delete({
                where: { id: id },
            });

            res.status(200).json({
                message: "Frauddesk contact deleted successfully",
                data,
            });
        } catch (error) {
            if (error.code === "P2025") {
                return res
                    .status(404)
                    .json({ error: "Frauddesk contact details not found" });
            }
            res.status(500).json({
                error: "An error occurred while updating the contact details",
            });
        }
    }
}
