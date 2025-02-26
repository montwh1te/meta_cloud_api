const express = require('express');
const body_parser = require('body-parser');
const axios = require('axios');
require('dotenv').config();
const { getAccessToken } = require('./getAccessToken');

const app = express().use(body_parser.json());
const PORT = 2000;

let token;
const mytoken = process.env.MYTOKEN;

app.listen(PORT || process.env.PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    token = await getAccessToken();
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

app.get('/' , (req, res) => {
    res.status(200).send('Hello this is webhook setup page');
});

app.post('/webhook', async (req, res) => {

    let body_param = req.body;

    console.log('Received webhook:', JSON.stringify(body_param, null, 2));

    if (body_param.object === 'whatsapp_business_account') {
        console.log('Inside body param');

        if (body_param.entry &&
            body_param.entry[0].changes &&
            body_param.entry[0].changes[0].value.messages &&
            body_param.entry[0].changes[0].value.messages[0]
        ) {
            let phon_no_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body_param.entry[0].changes[0].value.messages[0].from;
            let message = body_param.entry[0].changes[0].value.messages[0];
            let contact = body_param.entry[0].changes[0].value.contacts[0];

            console.log('Phone number ID:', phon_no_id);
            console.log('From:', from);
            console.log('Contact profile name:', contact.profile.name);

            if (message.text) {
                let msg_body = message.text.body;
                console.log('Message body:', msg_body);

                try {
                    const response = await axios({
                        method: "POST",
                        url: `https://graph.facebook.com/v22.0/${phon_no_id}/messages?access_token=${token}`,
                        data: {
                            messaging_product: "whatsapp",
                            to: from,
                            text: {
                                body: `O YAGLUTH VAI TE PEGAR. Você disse: ${msg_body}`
                            }
                        },
                        headers: {
                            "Content-Type": "application/json"
                        }
                    });

                    console.log('Message sent successfully:', response.data);
                    res.sendStatus(200);
                } catch (error) {
                    console.error('Error sending message:', error.response ? error.response.data : error.message);
                    res.sendStatus(500);
                }
            } else if (message.image) {
                let image_id = message.image.id;
                console.log('Image ID:', image_id);
                console.log('Image caption:', message.image.caption);
                console.log('Image MIME type:', message.image.mime_type);
                console.log('Image SHA256:', message.image.sha256);

                try {
                    const response = await axios({
                        method: "POST",
                        url: `https://graph.facebook.com/v22.0/${phon_no_id}/messages?access_token=${token}`,
                        data: {
                            messaging_product: "whatsapp",
                            to: from,
                            image: {
                                id: image_id,
                                caption: "Aqui está a sua foto de volta!"
                            }
                        },
                        headers: {
                            "Content-Type": "application/json"
                        }
                    });

                    console.log('Image sent successfully:', response.data);
                    res.sendStatus(200);
                } catch (error) {
                    console.error('Error sending image:', error.response ? error.response.data : error.message);
                    res.sendStatus(500);
                }
            } else {
                console.log('No valid message type found in the webhook');
                res.sendStatus(404);
            }
        } else {
            console.log('No valid message found in the webhook');
            res.sendStatus(404);
        }
    } else {
        console.log('Invalid webhook object');
        res.sendStatus(400);
    }
});