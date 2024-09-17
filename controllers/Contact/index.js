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
                                  contains: searchText,
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
                skip,
                take: pageSizeNumber,
            });

            return res.status(200).json({
                message: "All frauddesk contact details",
                data,
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
            });
            if (!data) {
                return res
                    .status(404)
                    .json({ error: "Frauddesk contact details not found" });
            }
            return res.status(200).json({
                message: "Frauddesk contact details",
                data,
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
                    merchantId,
                    merchant: merchantData.merchant,
                    name,
                    phone,
                    email,
                },
            });

            res.status(201).json({
                message: "New frauddesk contact added",
                data: {
                    id: fraudContact.id,
                    merchantId: fraudContact.merchantId,
                    merchant: merchantData.merchant,
                    name: fraudContact.name,
                    phone: fraudContact.phone,
                    email: fraudContact.email,
                },
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
            updateData.merchant = merchantData.merchant;
            updateData.merchantId = merchantData.id;
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
                data: updateData,
            });

            res.status(200).json({
                message: "Frauddesk contact details updated successfully",
                data: updatedContact,
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
