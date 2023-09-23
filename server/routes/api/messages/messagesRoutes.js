var express = require('express');
var router = express.Router();
var { body, validationResult } = require('express-validator');
var excel = require('exceljs');




// Model sequielize
var { Message } = require('../../../models')



// Email
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


// Template engine
var pug = require('pug');




// Fetch all
router.get('/', (req, res, next) => {
    let { page = 1, limit = 10, sort = "msg_id", order = "asc", ...filter } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    let offset = (page - 1) * limit;

    Message.findAll({
        where: filter,
        offset,
        limit: limit <= 0 ? undefined : limit,
        order: [[sort, order]]
    }).then(data => {
        res.send(data);
    }).catch((err) => {
        const { original: { code, sqlMessage } } = err;
        res.status(400).send({ error: { name: code, message: sqlMessage } });
    });
});




// Fetch by id  
router.get('/:id', function (req, res, next) {
    Message.findByPk(req.params.id).then(data => {
        if (data) {
            res.send(data);
        } else {
            res.status(400).send({ error: { name: "DataNotFound", message: "DataNotFound" } })
        }
    })
});




// Create 
router.post('/',
    body('name').notEmpty().trim().escape(),
    body('company').notEmpty().trim().escape(),
    body('email').notEmpty().isEmail().normalizeEmail(),
    body('phone').notEmpty().isLength({ min: 10, max: 10 }).isInt().trim(),
    body('subject').notEmpty().trim().escape(),
    body('message').notEmpty().trim().escape(),
    body('remark').notEmpty().trim().escape(),
    body('created_date').if(body('created_date').exists()).isDate(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
        } else {
            Message.create(req.body).then(data => {
                // SEND EMAIL
                const { name, email } = data;
                const msg = {
                    to: email, from: process.env.SENDGRID_FROM_EMAIL,
                    subject: `${name} - สมัครสมาชิกรับข้อมูลข่าวสารเรียบร้อย`,
                    html: pug.renderFile(`views/email/messages/signup.pug`, { data })
                }
                sgMail.send(msg).then((result) => { })
                res.send({ success: { message: "Insert successfully.", result: data } })
            }).catch((err) => {
                const { original: { code, sqlMessage } } = err;
                res.status(400).send({ error: { name: code, message: sqlMessage } });
            })
        }
    });






// Update
router.put('/:id',
    body('name').if(body('name').exists()).notEmpty().trim().escape(),
    body('company').if(body('company').exists()).notEmpty().trim().escape(),
    body('email').if(body('email').exists()).notEmpty().isEmail().trim().normalizeEmail(),
    body('phone').if(body('phone').exists()).notEmpty().isLength({ min: 10, max: 10 }).isInt().trim(),
    body('subject').if(body('subject').exists()).notEmpty().trim().escape(),
    body('message').if(body('message').exists()).notEmpty().trim().escape(),
    body('remark').if(body('remark').exists()).notEmpty().trim().escape(),
    body('created_date').if(body('created_date').exists()).isDate(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
        } else {
            Message.update(req.body, { where: { msg_id: req.params.id } }).then(data => {
                if (data[0] > 0) {
                    Message.findByPk(req.params.id).then(data => {
                        res.send({ success: { message: "Update successfully", result: data } });
                    });
                } else {
                    res.status(400).send({ error: { name: "Duplicates in the database.", message: "Duplicates in the database." } })
                }
            }).catch((err) => {
                const { original: { code, sqlMessage } } = err;
                res.status(400).send({ error: { name: code, message: sqlMessage } });
            });

        }
    });




// // Patch
router.patch('/:id',
    body('name').if(body('name').exists()).notEmpty().trim().escape(),
    body('company').if(body('company').exists()).notEmpty().trim().escape(),
    body('email').if(body('email').exists()).notEmpty().isEmail().trim().normalizeEmail(),
    body('phone').if(body('phone').exists()).notEmpty().isLength({ min: 10, max: 10 }).isInt().trim(),
    body('subject').if(body('subject').exists()).notEmpty().trim().escape(),
    body('message').if(body('message').exists()).notEmpty().trim().escape(),
    body('remark').if(body('remark').exists()).notEmpty().trim().escape(),
    body('created_date').if(body('created_date').exists()).isDate(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).send({ errors: errors.array() });
        } else {
            Message.update(req.body, { where: { msg_id: req.params.id } }).then(data => {
                if (data[0] > 0) {
                    Message.findByPk(req.params.id).then(data => {
                        res.send({ success: { message: "Update successfully", result: data } });
                    });
                } else {
                    res.status(400).send({ error: { name: "Duplicates in the database.", message: "Duplicates in the database." } })
                }
            }).catch((err) => {
                const { original: { code, sqlMessage } } = err;
                res.status(400).send({ error: { name: code, message: sqlMessage } });
            });

        }
    });





// Delete
router.delete('/:id', (req, res, next) => {
    Message.findByPk(req.params.id).then(data => {
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
router.get('/report/excel', (req, res, next) => {
    let { page = 1, limit = 10, sort = "msg_id", order = "asc", ...filter } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    let offset = (page - 1) * limit;

    Message.findAll({
        where: filter,
        offset,
        limit: limit <= 0 ? undefined : limit,
        order: [[sort, order]]
    }).then(data => {

        // EXCEL
        var workbook = new excel.Workbook();
        var worksheet = workbook.addWorksheet('SUBSCRIBE');

        // HEADER    
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'message.xlsx')

        // EXCEL : HEADER
        let columns = [];
        let paths = ['msg_id', 'name', 'company', 'email', 'phone', 'subject', 'message', 'remark', 'created_date'];
        paths.forEach(path => {
            columns.push({ header: path, key: path })
        });

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
            cell.alignment = { vertical: ' top', wrapText: true };
        })

        // BODY
        data.forEach(row => {
            const row_ = worksheet.addRow(row);
            row_.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            })
        });

        // WRITE EXCEL FILE AND SEND
        workbook.xlsx.write(res).then(function () {
            res.end();
        })
    }).catch((err) => {
        console.log(err);
        const { original: { code, sqlMessage } } = err;
        res.status(400).send({ error: { name: code, message: sqlMessage } });
    })
});










module.exports = router;


