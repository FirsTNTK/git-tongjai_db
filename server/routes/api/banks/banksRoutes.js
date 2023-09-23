var express = require('express');
var router = express.Router();
var { body, validationResult } = require('express-validator');
var excel = require('exceljs');


// var { Bank } = require('../../../models/bank')
// var { BankDetail } = require('../../../models/bank_detail')
// var { sequelize } = require('../../../models/index')
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
            order: [[sort, order]]
        });

        // ค้นหาข้อมูลจากตาราง BankDetail
        const bankDetails = await BankDetail.findAll({
            where: filter,
            include: [Bank], // รวมข้อมูลจากตาราง Bank
        });

        // รวมข้อมูลจากตาราง Bank และ BankDetail
        const combinedData = banks.map(bank => {
            const relatedBankDetail = bankDetails.find(detail => detail.bank_id === bank.bank_id);
            return {
                bank_id: bank.bank_id,
                account_name: relatedBankDetail ? relatedBankDetail.account_name : null,
                bank_name: relatedBankDetail ? relatedBankDetail.bank_name : null,
                bank_branch: relatedBankDetail ? relatedBankDetail.bank_branch : null,
                account_no: bank.account_no,
                account_code: bank.account_code,
                bank_thumbnail: bank.bank_thumbnail,
                language: relatedBankDetail ? relatedBankDetail.language : null,
                active: relatedBankDetail ? relatedBankDetail.active : null,
            };
        });

        res.send(combinedData);
    } catch (err) {
        const { original: { code, sqlMessage } } = err;
        res.status(400).send({ error: { name: code, message: sqlMessage } });
    }
});



// Fetch by id  
router.get('/:id', function (req, res, next) {
    Bank.findByPk(req.params.id).then(data => {
        if (data) {
            res.send(data);
        } else {
            res.status(400).send({ error: { name: "DataNotFound", message: "DataNotFound" } })
        }
    })
});


// Create 
// back up create 
// router.post('/',
//     body('account_no').notEmpty().isInt().trim().escape(),
//     body('account_code').notEmpty().isInt().trim().escape(),
//     body('bank_thumbnail').trim().escape(),
//     body('language').notEmpty().trim().escape(),
//     body('bank_name').notEmpty().trim().escape(),
//     body('bank_branch').notEmpty().trim().escape(),
//     body('account_name').notEmpty().trim().escape(),
//     body('active').notEmpty().isInt().trim().escape(),


//     (req, res, next) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             res.status(400).send({ errors: errors.array() });
//         } else {
//             banksApi.create(req.body).then(data => {
//                 res.send({ success: { message: "Insert successfully.", result: data } })
//             }).catch((err) => {
//                 console.log(err);
//                 const { original: { code, sqlMessage } } = err;
//                 res.status(400).send({ error: { name: code, message: sqlMessage } });
//             })
//         }
//     });






router.post('/', [
    body('account_no').notEmpty().isInt().trim().escape(),
    body('account_code').notEmpty().isInt().trim().escape(),
    body('bank_thumbnail').trim().escape(),
    body('language').notEmpty().trim().escape(),
    body('bank_name').notEmpty().trim().escape(),
    body('bank_branch').notEmpty().trim(),
    body('account_name').notEmpty().trim().escape(),
    body('active').notEmpty().isInt().trim().escape(),
], async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors)
        res.status(400).send({ errors: errors.array() });
    } else {
        const { account_no, account_code, bank_thumbnail, language, bank_name, bank_branch, account_name, active } = req.body;

        try {
            // เริ่ม Transaction Sequelize
            await sequelize.transaction(async (t) => {
                // สร้างข้อมูลในตาราง Bank
                const bank = await Bank.create({
                    account_no,
                    account_code,
                    bank_thumbnail,

                }, { transaction: t });

                // สร้างข้อมูลในตาราง BankDetail โดยใช้ bank_id จากข้อมูลที่สร้างในตาราง Bank
                await BankDetail.create({
                    bank_id: bank.bank_id,
                    language,
                    bank_name,
                    bank_branch,
                    account_name,
                    active: bank.active
                }, { transaction: t });
            });

            res.send({ success: { message: "Insert successfully." } });
        } catch (err) {
            console.error(err);
            const { original: { code, sqlMessage } } = err;
            res.status(400).send({ error: { name: code, message: sqlMessage } });
        }
    }
});







// Update
// router.put('/:id',
//     body('account_no').notEmpty().isInt().trim().escape(),
//     body('account_code').notEmpty().isInt().trim().escape(),
//     // body('bank_thumnail').notEmpty().isEmail().trim().normalizeEmail(),
//     body('active').notEmpty().isInt().trim().escape(),

//     (req, res, next) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             res.status(400).send({ errors: errors.array() });
//         } else {
//             Bank.update(req.body, { where: { subscribe_id: req.params.id } }).then(data => {
//                 if (data[0] > 0) {
//                     Bank.findByPk(req.params.id).then(data => {
//                         res.send({ success: { message: "Update successfully", result: data } });
//                     });
//                 } else {
//                     res.status(400).send({ error: { name: "DataNotFound", message: "DataNotFound" } })
//                 }
//             }).catch((err) => {
//                 const { original: { code, sqlMessage } } = err;
//                 res.status(400).send({ error: { name: code, message: sqlMessage } });
//             });

//         };
//     });


// Patch
// router.patch('/:id',
//     body('account_no').notEmpty().isInt().trim().escape(),
//     body('account_code').notEmpty().isInt().trim().escape(),
//     // body('bank_thumnail').notEmpty().isEmail().trim().normalizeEmail(),
//     body('active').notEmpty().trim().escape(),

//     (req, res, next) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             res.status(400).send({ errors: errors.array() });
//         } else {
//             Bank.update(req.body, { where: { subscribe_id: req.params.id } }).then(data => {
//                 if (data[0] > 0) {
//                     Bank.findByPk(req.params.id).then(data => {
//                         res.send({ success: { message: "Update successfully", result: data } });
//                     });
//                 } else {
//                     res.status(400).send({ error: { name: "DataNotFound", message: "DataNotFound" } })
//                 }
//             }).catch((err) => {
//                 const { original: { code, sqlMessage } } = err;
//                 res.status(400).send({ error: { name: code, message: sqlMessage } });
//             });

//         }
//     });





// Delete
router.delete('/:id', (req, res, next) => {
    Bank.findByPk(req.params.id).then(data => {
        if (data != null) {
            data.destroy().then(result => {
                res.send({ success: { message: "Delete successfully", result: data } });
            });
        } else {
            res.status(400).send({ error: { name: "DataNotFound", message: "DataNotFound" } });
        }
    });
});






// EXPORT EXCEL
// router.get('/report/excel', (req, res, next) => {
//     let { page = 1, limit = 10, sort = "bank_id", order = "asc", ...filter } = req.query;
//     page = parseInt(page);
//     limit = parseInt(limit);
//     let offset = (page - 1) * limit;

//     Bank.findAll({
//         where: filter,
//         offset,
//         limit: limit <= 0 ? undefined : limit,
//         order: [[sort, order]]
//     }).then(data => {

//         // EXCEL
//         var workbook = new excel.Workbook();
//         var worksheet = workbook.addWorksheet('BANK');

//         // HEADER    
//         res.setHeader('Content-Type', 'application/vnd.openxmlformats');
//         res.setHeader('Content-Disposition', 'attachment; filename=' + 'bank.xlsx')

//         // EXCEL : HEADER
//         let columns = [];
//         let paths = ['bank_id','account_name','bank_name','bank_branch', 'account_no', 'account_code', 'bank_thumnail','language', 'active'];
//         paths.forEach(path => {
//             columns.push({ header: path, key: path })
//         });

//         // COLUMNS 
//         worksheet.columns = columns;
//         worksheet.columns.forEach(column => {
//             column.width = 20;
//         });


//         // AUTOFILTERS  
//         worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: worksheet.actualColumnCount } };

//         // STYLES  
//         worksheet.getRow(1).eachCell((cell, colNumber) => {
//             cell.font = { bold: true, color: { argb: 'FFFFFFF' } };
//             cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
//             cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC61633' } };
//             cell.alignment = { vertical: ' top', wrapText: true };
//         })

//         // BODY
//         data.forEach(row => {
//             const row_ = worksheet.addRow(row);
//             row_.eachCell({ includeEmpty: true }, (cell, colNumber) => {
//                 cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
//             })
//         });

//         // WRITE EXCEL FILE AND SEND
//         workbook.xlsx.write(res).then(function () {
//             res.end();
//         })
//     }).catch((err) => {
//         const { original: { code, sqlMessage } } = err;
//         res.status(400).send({ error: { name: code, message: sqlMessage } });
//     })
// });





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

        // รวมข้อมูลจากตาราง Bank และ BankDetail
        const combinedData = banks.map(bank => {
            const relatedBankDetail = bankDetails.find(detail => detail.bank_id === bank.bank_id);
            return {
                bank_id: bank.bank_id,
                account_name: relatedBankDetail ? relatedBankDetail.account_name : null,
                bank_name: relatedBankDetail ? relatedBankDetail.bank_name : null,
                bank_branch: relatedBankDetail ? relatedBankDetail.bank_branch : null,
                account_no: bank.account_no,
                account_code: bank.account_code,
                bank_thumbnail: bank.bank_thumbnail,
                language: relatedBankDetail ? relatedBankDetail.language : null,
                active: relatedBankDetail ? relatedBankDetail.active : null,
            };
        });

        // EXCEL
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('BANK');

        // HEADER
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader('Content-Disposition', 'attachment; filename=bank.xlsx');

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
            };
            worksheet.addRow(rowData);
        });

        // WRITE EXCEL FILE AND SEND
        const buffer = await workbook.xlsx.writeBuffer();
        res.type('xlsx');
        res.send(buffer);
    } catch (err) {
        console.log(err)
        const { original: { code, sqlMessage } } = err;
        res.status(400).send({ error: { name: code, message: sqlMessage } });
    }
});






module.exports = router;



