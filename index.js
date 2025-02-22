const express = require('express');
const body_parser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express().use(body_parser.json());
const PORT = 2000;

const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;

app.listen(PORT || process.env.PORT, () => {
    console.log(`Server running on port ${PORT}`)
});

// para verificar a chamada de url feita pelo lado do dashboard - cloud api side
app.get('/webhook', (req, res) => {
    let mode = req.query['hub.mode'];
    let challenge = req.query['hub.challenge'];
    let token = req.query['hub.verify_token'];

    if(mode && token) {
        if(mode==='subscribe' && token===mytoken) {
            console.log('Webhook verified');
            res.status(200).send(challenge);
        } else {
            console.log('Webhook not verified');
            res.status(403);
        }
    }
});

app.post('/webhook', (req, res) => {

    let body_param = req.body;

    console.log(JSON.stringify(body_param, null, 2));

    if (body_param.entry && 
        body_param.entry[0].changes &&
        body_param.entry[0].changes[0].value.messages &&
        body_param.entry[0].changes[0].value.messages[0]
    ){
        let phon_no_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
        let from = body_param.entry[0].changes[0].value.messages[0].from;
        let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

        axios({
            method: "POST",
            url: "https://graph.facebook.com/v21.0/"+phon_no_id+"/messages?access_token="+token,
            data: {
                messaging_product: "whatsapp",
                to: from,
                text: {
                    body: "O YAGLUTH VAI TE PEGAR"
                }
            },
            headers: {
                "Content-Type": "application/json"
            }
        })

        res.sendStatus(200);
        
    } else {
        res.sendStatus(404);
    };
});