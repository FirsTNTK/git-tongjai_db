var express = require('express');
var router = express.Router();
var { body, validationResult } = require('express-validator');
var excel = require('exceljs');



const { Bank, BankDetail, sequelize } = require('../../../models');




// Fetch all
router.get('/', async (req, res, next) => {
    let { page = 1, limit = 10, sort = "bank_id", order = "asc", ...filter } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    let offset = (page - 1) * limit;

    try {

        const banks = await Bank.findAll({
            where: filter,
            offset,
            limit: limit <= 0 ? undefined : limit,
            order: [[sort, order]],
            include: [BankDetail]
        });

        // ค้นหาข้อมูลจากตาราง BankDetail
        // const bankDetails = await BankDetail.findAll({
        //     where: filter,
        //     include: [Bank], // รวมข้อมูลจากตาราง Bank
        // });

        // // รวมข้อมูลจากตาราง Bank และ BankDetail
        // const combinedData = banks.map(bank => {
        //     const relatedBankDetail = bankDetails.find(detail => detail.bank_id === bank.bank_id);
        //     return {
        //         bank_id: bank.bank_id,
        //         account_name: relatedBankDetail ? relatedBankDetail.account_name : null,
        //         bank_name: relatedBankDetail ? relatedBankDetail.bank_name : null,
        //         bank_branch: relatedBankDetail ? relatedBankDetail.bank_branch : null,
        //         account_no: bank.account_no,
        //         account_code: bank.account_code,
        //         bank_thumbnail: bank.bank_thumbnail,
        //         language: relatedBankDetail ? relatedBankDetail.language : null,
        //         active: relatedBankDetail ? relatedBankDetail.active : null,
        //     };
        // });

        res.send(banks);
    } catch (err) {
        const { original: { code, sqlMessage } } = err;
        res.status(400).send({ error: { name: code, message: sqlMessage } });
    }
});





// // Fetch by id  
router.get('/:id', async (req, res, next) => {
    const { id } = req.params;

    try {
        // ค้นหาข้อมูลจากตาราง Bank โดยใช้ id ที่กำหนด
        const bank = await Bank.findByPk(id, {
            include: [BankDetail] // รวมข้อมูลจากตาราง BankDetail
        });

        if (!bank) {
            return res.status(404).send({ error: "Bank not found" });
        }
        res.send(bank);
    } catch (err) {
        console.log(err)
        const { original: { code, sqlMessage } } = err;
        res.status(400).send({ error: { name: code, message: sqlMessage } });
    }
});






// Create 
router.post('/', [
    body('account_no').notEmpty().trim().escape(),
    body('account_code').notEmpty().trim().escape(),
    body('bank_thumbnail').trim().escape(),
    // body('language').notEmpty().trim().escape(),
    // body('bank_name').notEmpty().trim().escape(),
    // body('bank_branch').notEmpty().trim(),
    // body('account_name').notEmpty().trim().escape(),
    body('active').notEmpty().isInt().trim().escape(),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).send({ errors: errors.array() });
    } else {
        const { account_no, account_code, bank_thumbnail, active, BankDetails } = req.body;
        try {
            // เริ่ม Transaction Sequelize
            await sequelize.transaction(async (t) => {
                // สร้างข้อมูลในตาราง Bank
                const bank = await Bank.create({
                    account_no,
                    account_code,
                    bank_thumbnail,
                    active

                }, { transaction: t });
                // สร้างข้อมูลในตาราง BankDetail โดยใช้ bank_id จากข้อมูลที่สร้างในตาราง Bank
                for (const detail of BankDetails) {
                    await BankDetail.create({
                        bank_id: bank.bank_id,
                        language: detail.language,
                        bank_name: detail.bank_name,
                        bank_branch: detail.bank_branch,
                        account_name: detail.account_name,
                    }, { transaction: t });
                }
            });
            res.send({ success: { message: "Insert successfully.", result: req.body } });
        } catch (err) {
            // ในกรณีที่มีข้อผิดพลาดเกิดขึ้นในการทำธุรกรรม
            console.error(err); // แสดงข้อผิดพลาดใน console เพื่อการตรวจสอบ

            // เพิ่มข้อมูลเพิ่มเติมในการตอบกลับเกี่ยวกับข้อผิดพลาด SQL
            res.status(400).send({
                error: {
                    name: "TransactionError",
                    message: "An error occurred during transaction",
                    sqlError: err.message, // เพิ่มข้อมูล SQL ข้อผิดพลาด
                }
            });
        }
    }
});







// Update
router.put('/:id', [
    body('account_no').if(body('account_no').exists().optional()).notEmpty().isInt().trim().escape(),
    body('account_code').if(body('account_code').exists().optional()).notEmpty().isInt().trim().escape(),
    body('bank_thumbnail').trim().escape(),
    body('language').if(body('language').exists().optional()).notEmpty().trim().escape(),
    body('bank_name').if(body('bank_name').exists().optional()).notEmpty().trim().escape(),
    body('bank_branch').if(body('bank_branch').exists().optional()).notEmpty().trim(),
    body('account_name').if(body('account_name').exists().optional()).notEmpty().trim().escape(),
    body('active').if(body('active').exists().optional()).notEmpty().isInt(),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).send({ errors: errors.array() });
    } else {
        const bankId = req.params.id;
        const updatedBankData = req.body;

        try {
            // เริ่มทรานแซคชัน
            console.log(updatedBankData)
            await sequelize.transaction(async (t) => {
                // อัปเดตข้อมูลในตาราง Bank
                const [updatedBankCount] = await Bank.update(updatedBankData, {
                    where: { bank_id: bankId },
                    transaction: t,
                });

                if (updatedBankCount > 0) {
                    // อัปเดตข้อมูลในตาราง BankDetail
                    const [updatedBankDetailCount] = await BankDetail.update(updatedBankData, {
                        where: { bank_id: bankId },
                        transaction: t,
                    });

                    if (updatedBankDetailCount > 0) {
                        // ค้นหาข้อมูลธนาคารหลังจากการอัปเดตทั้งคู่
                        const updatedBank = await Bank.findByPk(bankId, { transaction: t });
                        const updatedBankDetail = await BankDetail.findOne({ where: { bank_id: bankId }, transaction: t });

                        // ส่งข้อมูลที่อัปเดตแล้วในการตอบกลับ
                        res.send({ success: { message: "Update successfully", result: { bank: updatedBank, bankDetail: updatedBankDetail } } });
                    } else {
                        throw new Error("Failed to update BankDetail");
                    }
                } else {
                    throw new Error("Failed to update Bank");
                }
            });
        } catch (err) {
            // ในกรณีที่มีข้อผิดพลาดเกิดขึ้นในการทำธุรกรรม
            console.error(err); // แสดงข้อผิดพลาดใน console เพื่อการตรวจสอบ

            // เพิ่มข้อมูลเพิ่มเติมในการตอบกลับเกี่ยวกับข้อผิดพลาด SQL
            res.status(400).send({
                error: {
                    name: "TransactionError",
                    message: "An error occurred during transaction",
                    sqlError: err.message, // เพิ่มข้อมูล SQL ข้อผิดพลาด
                }
            });
        }
    }
});





// } catch (err) {ั

//     console.error(err);
//     if (err) { // เพิ่มเงื่อนไขตรวจสอบว่า err ไม่เป็น undefined
//         const { original: { code, sqlMessage } } = err;
//         res.status(400).send({ error: { name: code, message: sqlMessage } });
//     } else {
//         res.status(400).send({ error: { name: "UnknownError", message: "An unknown error occurred" } });
//     }
// }
// }
// });



// Patch
// router.patch('/:id', [
//     body('account_no').notEmpty().isInt().trim().escape(),
//     body('account_code').notEmpty().isInt().trim().escape(),
//     body('bank_thumbnail').trim().escape(),
//     body('language').notEmpty().trim().escape(),
//     body('bank_name').notEmpty().trim().escape(),
//     body('bank_branch').notEmpty().trim(),
//     body('account_name').notEmpty().trim().escape(),
//     body('active').notEmpty().isInt().trim().escape(),
// ], async (req, res, next) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         res.status(400).send({ errors: errors.array() });
//     } else {
//         const bankId = req.params.id;
//         const updatedBankData = req.body;

//         try {
//             // เริ่มทรานแซคชัน
//             await sequelize.transaction(async (t) => {
//                 // อัปเดตข้อมูลในตาราง Bank
//                 const [updatedBankCount] = await Bank.update(updatedBankData, {
//                     where: { bank_id: bankId },
//                     transaction: t,
//                 });

//                 if (updatedBankCount > 0) {
//                     // อัปเดตข้อมูลในตาราง BankDetail
//                     const [updatedBankDetailCount] = await BankDetail.update(updatedBankData, {
//                         where: { bank_id: bankId },
//                         transaction: t,
//                     });

//                     if (updatedBankDetailCount > 0) {
//                         // ค้นหาข้อมูลธนาคารหลังจากการอัปเดตทั้งคู่
//                         const updatedBank = await Bank.findByPk(bankId, { transaction: t });
//                         const updatedBankDetail = await BankDetail.findOne({ where: { bank_id: bankId }, transaction: t });

//                         // ส่งข้อมูลที่อัปเดตแล้วในการตอบกลับ
//                         res.send({ success: { message: "Update successfully", result: { bank: updatedBank, bankDetail: updatedBankDetail } } });
//                     } else {
//                         throw new Error("Failed to update BankDetail");
//                     }
//                 } else {
//                     throw new Error("Failed to update Bank");
//                 }
//             });
//         } catch (err) {
//             if (err !== undefined) { // เพิ่มเงื่อนไขตรวจสอบว่า err ไม่เป็น undefined
//                 console.log(err)
//                 const { original: { code, sqlMessage } } = err;
//                 res.status(400).send({ error: { name: code, message: sqlMessage } });
//             } else {
//                 res.status(400).send({ error: { name: "UnknownError", message: "An unknown error occurred" } });
//             }
//         }
//     }
// });







// Delete
router.delete('/:id', async (req, res, next) => {
    try {
        const bankId = req.params.id;
        // ค้นหาข้อมูลจากตาราง Bank และ BankDetail พร้อมกัน
        const [bank, bankDetail] = await Promise.all([
            Bank.findByPk(bankId),
            BankDetail.findAll({ where: { bank_id: bankId } }), // ใช้ findAll เพื่อค้นหาทั้งหมด
        ]);
        if (!bank || !bankDetail || bankDetail.length === 0) {
            return res.status(400).send({ error: { name: "DataNotFound", message: "Bank or BankDetail data not found" } });
        }
        // ลบข้อมูล
        await bank.destroy();
        await BankDetail.destroy({ where: { bank_id: bankId } }); // ลบข้อมูล BankDetail ที่เกี่ยวข้องกับ bank_id

        // สร้างอ็อบเจ็กต์ใหม่ที่รวมข้อมูลทั้งสองตาราง
        const responseData = {
            success: {
                message: "Deleted successfully.",
                result: {
                    bank: {
                        bank_id: bank.bank_id,
                        account_no: bank.account_no,
                        account_code: bank.account_code,
                        bank_thumbnail: bank.bank_thumbnail,
                        active: bank.active,
                    },
                    include: bankDetail // แสดงข้อมูลทั้งหมดของ BankDetail
                },
            },
        };

        // แสดงข้อมูลทั้งสองตารางรวมกันในการตอบกลับ
        res.send(responseData);

    } catch (err) {
        console.error(err);
        const { original: { code, sqlMessage } } = err;
        res.status(400).send({ error: { name: code, message: sqlMessage } });
    }
});






// EXPORT EXCEL
router.get('/report/excel', async (req, res, next) => {
    try {
        let { page = 1, limit = 10, sort = "bank_id", order = "asc", ...filter } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        let offset = (page - 1) * limit;

        // ค้นหาข้อมูลจากตาราง Bank
        const banks = await Bank.findAll({
            where: filter,
            offset,
            limit: limit <= 0 ? undefined : limit,
            order: [[sort, order]]
        });

        // ค้นหาข้อมูลจากตาราง BankDetail
        const bankDetails = await BankDetail.findAll({
            where: filter,
            include: [Bank], // รวมข้อมูลจากตาราง Bank
        });

        // สร้าง Map ของ bank_id และข้อมูล BankDetail
        const bankDetailsMap = new Map();
        bankDetails.forEach(detail => {
            bankDetailsMap.set(detail.bank_id, detail);
        });

        // รวมข้อมูลจากตาราง Bank และ BankDetail
        const combinedData = banks.map(bank => {
            const relatedBankDetails = bankDetails.filter(detail => detail.bank_id === bank.bank_id);
            const rowDataArray = relatedBankDetails.map(relatedBankDetail => {
                return {
                    bank_id: bank.bank_id,
                    account_name: relatedBankDetail.account_name,
                    bank_name: relatedBankDetail.bank_name,
                    bank_branch: relatedBankDetail.bank_branch,
                    account_no: bank.account_no,
                    account_code: bank.account_code,
                    bank_thumbnail: bank.bank_thumbnail,
                    language: relatedBankDetail.language,
                    active: bank.active,
                };
            });
            return rowDataArray;
        }).flat();
       

        // EXCEL
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('BANK');

        // EXCEL : HEADER
        let columns = [
            { header: 'bank_id', key: 'bank_id' },
            { header: 'account_name', key: 'account_name' },
            { header: 'bank_name', key: 'bank_name' },
            { header: 'bank_branch', key: 'bank_branch' },
            { header: 'account_no', key: 'account_no' },
            { header: 'account_code', key: 'account_code' },
            { header: 'bank_thumbnail', key: 'bank_thumbnail' },
            { header: 'language', key: 'language' },
            { header: 'active', key: 'active' },
        ];


        // COLUMNS
        worksheet.columns = columns;
        worksheet.columns.forEach(column => {
            column.width = 20;
        });

        // AUTOFILTERS
        worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: worksheet.actualColumnCount } };

        // STYLES
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFF' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC61633' } };
            cell.alignment = { vertical: 'top', wrapText: true };
        });

        // BODY
        combinedData.forEach(row => {
            const rowData = {
                bank_id: row.bank_id,
                account_name: row.account_name,
                bank_name: row.bank_name,
                bank_branch: row.bank_branch,
                account_no: row.account_no,
                account_code: row.account_code,
                bank_thumbnail: row.bank_thumbnail,
                language: row.language,
                active: row.active
            };
            worksheet.addRow(rowData);
        });

        // WRITE EXCEL FILE AND SEND
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader('Content-Disposition', 'attachment; filename=bank.xlsx');
        res.end(buffer, 'binary');

    } catch (err) {
        console.log(err);
        const { original: { code, sqlMessage } } = err;
        res.status(400).send({ error: { name: code, message: sqlMessage } });
    }
});






module.exports = router;



