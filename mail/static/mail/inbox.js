document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');
});

// ----  Create New Email  ---- //

function compose_email() {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#view-mail').style.display = 'none';
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    const submit = document.querySelector('#send-form');
    const subject = document.querySelector('#compose-subject');
    const body = document.querySelector('#compose-body');
    const recipients = document.querySelector('#compose-recipients');

    // Validating the form
    submit.disabled = true;
    document.onkeyup = () => {
        if (recipients.value.length > 0 && subject.value.length > 0 && body.value.length > 0) {
            submit.disabled = false;
        }
        else {
            submit.disabled = true;
        }
    }

    //Submiting the form
    document.querySelector('form').onsubmit = function () {
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipients.value,
                subject: subject.value,
                body: body.value,
                read: false,
            })
        })
            .then(response => response.json())
            .then(result => {
                if (result.message !== "Email sent successfully.") {
                    alert(result.error)
                }
            });
    };
}


// ----  Inbox View  ---- //

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-mail').style.display = 'none';

    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {
            emails.forEach(item => {
                const element = document.createElement('div');
                if (item.read) {
                    element.className = "Read";
                }
                else {
                    element.className = "Unread";
                }
                element.innerHTML = `<div class="container inbox"><div class="row"><div class="col-md-4 col-sm-10"><p class="h5"> ${item.subject} </p></div><div class="col-md-4 col-sm-10"><p>From: ${item.sender} </p></div><div class="col-md-4 col-sm-10"><p>Date: ${item.timestamp}</p></div></div></div>`;
                element.addEventListener('click', () => view_mail(item.id, mailbox));
                document.querySelector('#emails-view').append(element);
            }
            );
        });
}


// ----  Read Each Email  ----//

function view_mail(id, mailbox) {
    // hide other views
    document.querySelector('#view-mail').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    // mark as read
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    })
    // show email content
    fetch(`/emails/${id}`)
        .then(response => response.json())
        .then(email => {
            document.querySelector('#view-mail').innerHTML = `<h4>Subject: ${email.subject}</h4><h4>Sender: ${email.sender}</h4><h4>Recipients: ${email.recipients}</h4><h6>Date: ${email.timestamp}</h6><hr><p class="my-5 mx-5">${email.body}</p><hr>`;
            if (!(mailbox === "sent")) {
                const element = document.createElement('button');
                if (email.archived === false) {
                    element.setAttribute('class', "btn btn-sm btn-outline-success px-4");
                    element.innerHTML = "Archive";
                    element.addEventListener('click', () => archive(`${email.id}`));
                }
                else {
                    element.setAttribute('class', "btn btn-sm btn-outline-danger px-4");
                    element.innerHTML = "Unarchive";
                    element.addEventListener('click', () => unarchive(`${email.id}`));
                }
                document.querySelector('#view-mail').append(element);
            }

            const newelement = document.createElement('button');
            newelement.setAttribute('class', "btn btn-sm btn-info px-5 ml-3");
            newelement.innerHTML = "Reply";
            newelement.addEventListener('click', () => reply_mail(email));
            document.querySelector('#view-mail').append(newelement);
        });
}


// ----  Reply Email  ---- //

function reply_mail(email) {
    let subject = email.subject;
    if (!subject.startsWith("Re:")) {
        subject = `Re: ${subject}`
    }
    compose_email();
    document.querySelector('#compose-recipients').value = `${email.sender}`;
    document.querySelector('#compose-subject').value = `${subject}`;
    document.querySelector('#compose-body').value = `\nOn ${email.timestamp} ${email.sender} wrote:\n\n ${email.body}`;
}


// -----  Archive-Un Email  ----- //

function archive(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
    })
    load_mailbox('inbox');
}

function unarchive(id) {
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
    })
    load_mailbox('inbox');
}