import prisma from "../../utils/db.js";
import { validateFields } from "../../utils/helpers.js";

export default class ChannelController {
    /**
     * Register new channel
     * @param {Request} req
     * @param {Response} res
     * @returns JSON
     */

    static async getAllChannels(_, res) {
        try {
            const data = await prisma.channel.findMany();
            return res.status(200).json({
                message: "All channels",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occurred while retrieving all merchants.",
            });
        }
    }

    static async getChannelById(req, res) {
        const { id } = req.params;

        try {
            const data = await prisma.channel.findFirst({
                where: { id: id },
            });
            if (!data) {
                return res.status(404).json({
                    error: "Channel not found",
                });
            }
            return res.status(200).json({
                message: "Channel",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                error: "An error occoured while retrieving the channel",
            });
        }
    }

    static async createChannel(req, res) {
        /**
         * Create new channel
         */
        try {
            const { user } = req;
            const { name } = req.body;
            const requiredFields = ["name"];
            if (!validateFields(req, res, requiredFields)) {
                return;
            }
            const existingChannel = await prisma.channel.findFirst({
                where: { name: name },
            });

            if (existingChannel) {
                return res.status(403).json({
                    error: "Channel with the same name already exist.",
                });
            }
            const data = await prisma.channel.create({
                data: {
                    name: name,
                    createdById: user.id,
                },
            });
            const creator = await prisma.user.findFirst({
                where: {
                    id: user.id,
                },
            });
            const { password, refreshToken, merchantsCreated, ...userData } = creator;
            res.status(201).json({
                message: "New channel creaded successfully.",
                data: {
                    id: data.id,
                    name: data.name,
                    createdAt: data.createdAt,
                    createdBy: userData,
                },
            });
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                error: "An error occurred while creating the channel.",
            });
        }
    }

    static async updateChannel(req, res) {
        /**
         * Update a particular channel using it UUID
         */
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "No field provided for update" });
        }

        const updateData = {};

        if (name) {
            const existingChannel = await prisma.channel.findFirst({
                where: { name: name },
            });

            if (existingChannel) {
                return res.status(403).json({
                    error: "Channel with the same name already exist",
                });
            }
            updateData.name = name;
        }

        try {
            const data = await prisma.channel.update({
                where: { id: id },
                data: updateData,
            });

            res.status(200).json({
                message: "Channel updated successfully",
                data,
            });
        } catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Channel not found" });
            }
            return res
                .status(500)
                .json({ error: "An error occurred while updating the channel." });
        }
    }

    static async deleteChannel(req, res) {
        /**
         * Delete a particular channel
         */
        const { id } = req.params;
        try {
            await prisma.channel.delete({
                where: { id: id },
            });
            res.status(204).json({
                message: "Channel deleted successfully",
            });
        } catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Channel not found" });
            }
            return res
                .status(500)
                .json({ error: "An error occurred while deleting the channel." });
        }
    }
}
