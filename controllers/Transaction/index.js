import prisma from "../../utils/db.js";
import { validateFields } from "../../utils/helpers.js";
import validator from "validator";

export default class TransactionController {
    /**
     * Register new transaction
     * @param {Request} req
     * @param {Response} res
     * @returns JSON
     */

    static async getAllTransactions(req, res) {
        try {
            const { page = 1, pageSize = 5, searchText = "", status = "" } = req.query;

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
                              channel: {
                                  name: { contains: searchText },
                              },
                          },
                          { type: { contains: searchText } },
                          { status: { contains: searchText } },
                          {
                              analyst: {
                                  firstname: {
                                      contains: searchText,
                                  },
                              },
                          },
                          {
                              analyst: {
                                  lastname: { contains: searchText },
                              },
                          },
                      ],
                  }
                : {};

            const statusCondition = status ? { status } : {};

            const whereCondition = {
                AND: [searchCondition, statusCondition],
            };

            const totalRecords = await prisma.transaction.count({
                where: whereCondition,
            });

            // Fetch the transaction data with related entities (merchant, channel, analyst)
            const data = await prisma.transaction.findMany({
                where: whereCondition,
                include: {
                    merchant: true,
                    channel: true,
                    analyst: true,
                },
                skip,
                take: pageSizeNumber,
                orderBy: {
                    createdAt: "desc",
                },
            });

            // Sanitize sensitive fields from the analyst data
            const sanitizedData = data.map((transaction) => {
                const {
                    analyst: { password, refreshToken, ...sanitizedAnalyst } = {},
                    ...rest
                } = transaction;

                return {
                    ...rest,
                    analyst: sanitizedAnalyst,
                };
            });

            // Return the result with pagination details
            return res.status(200).json({
                message: "All fraudulent transactions",
                data: sanitizedData,
                pageCount: Math.ceil(totalRecords / pageSizeNumber),
                totalRecords,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving all transactions.",
            });
        }
    }

    static async getTransactionById(req, res) {
        /**
         * Get transaction by Id
         */
        const { id } = req.params;

        try {
            const data = await prisma.transaction.findFirst({
                where: { id: id },
                include: {
                    merchant: true,
                    channel: true,
                    analyst: true,
                },
            });
            if (!data) {
                return res.status(404).json({
                    error: "Transaction not found.",
                });
            }
            const {
                analyst: { password, refreshToken, ...sanitizedAnalyst } = {},
                ...rest
            } = data;

            const sanitizedData = {
                ...rest,
                analyst: sanitizedAnalyst,
            };

            return res.status(200).json({
                message: "Fraudulent transaction",
                data: sanitizedData,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving the transaction",
            });
        }
    }

    static async createTransaction(req, res) {
        /**
         * Create or add a new transaction to the DB
         */
        try {
            const { merchantId, amount, type, channelId, analystId, status } = req.body;
            const requiredFields = [
                "merchantId",
                "amount",
                "type",
                "channelId",
                "analystId",
                "status",
            ];

            if (!validateFields(req, res, requiredFields)) {
                return;
            }

            if (!validator.isNumeric(amount.toString())) {
                return res.status(400).json({ error: "Amount should be a valid number" });
            }
            const merchantData = await prisma.merchant.findFirst({
                where: {
                    id: merchantId,
                },
            });

            const analystData = await prisma.user.findFirst({
                where: {
                    id: analystId,
                },
            });

            const channelData = await prisma.channel.findFirst({
                where: {
                    id: channelId,
                },
            });

            if (!merchantData) {
                return res.status(404).json({
                    error: "Merchant does not exist.",
                });
            }

            if (!analystData) {
                return res.status(404).json({
                    error: "Analyst does not exist.",
                });
            }

            if (!channelData) {
                return res.status(404).json({
                    error: "Channel does not exist.",
                });
            }
            const data = await prisma.transaction.create({
                data: {
                    merchantId: merchantData.id,
                    amount,
                    type,
                    channelId: channelData.id,
                    analystId: analystData.id,
                    status,
                },
            });

            const { password, refreshToken, ...userData } = analystData;

            res.status(201).json({
                message: "New fraudulent transaction created",
                data: {
                    transaction: data,
                    merchant: merchantData,
                    analyst: userData,
                    channel: channelData,
                },
            });
        } catch (error) {
            res.status(500).json({
                error: "An error occurred while creating the transaction.",
            });
        }
    }

    static async updateTransaction(req, res) {
        /**
         * Update a particular transaction using its UUID
         */
        const { id } = req.params;
        const { merchantId, amount, type, channelId, analystId, status } = req.body;

        if (!merchantId && !amount && !type && !channelId && !analystId) {
            return res.status(400).json({ error: "No fields provided for update" });
        }

        const updateData = {};

        if (merchantId) {
            const merchantData = await prisma.merchant.findFirst({
                where: {
                    id: merchantId,
                },
            });

            if (!merchantData) {
                return res.status(404).json({ error: "Merchant does not exist." });
            }

            updateData.merchantId = merchantData.id;
        }

        if (analystId) {
            const analystData = await prisma.user.findFirst({
                where: {
                    id: analystId,
                },
            });

            if (!analystData) {
                return res.status(404).json({ error: "Analyst does not exist." });
            }

            updateData.analystId = analystData.id;
        }

        if (channelId) {
            const channelData = await prisma.channel.findFirst({
                where: {
                    id: channelId,
                },
            });

            if (!channelData) {
                return res.status(404).json({ error: "Channel does not exist." });
            }

            updateData.channelId = channelData.id;
        }

        if (amount) updateData.amount = amount;
        if (type) updateData.type = type;
        if (status) updateData.status = status;

        try {
            const data = await prisma.transaction.update({
                where: { id: id },
                data: updateData,
            });

            res.status(200).json({
                message: "Transaction updated successfully",
                data,
            });
        } catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Transaction not found" });
            }
            res.status(500).json({
                error: "An error occurred while updating the transaction.",
            });
        }
    }

    static async deleteTransaction(req, res) {
        /**
         * Delete a transaction using its unique ID
         */
        const { id } = req.params;
        try {
            const data = await prisma.transaction.delete({
                where: { id: id },
            });
            return res.status(200).json({
                message: "Transaction deleted successfully",
                data,
            });
        } catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Transaction not found" });
            }
            return res.status(500).json({
                error: "An error occurred while deleting the transaction.",
            });
        }
    }
}
