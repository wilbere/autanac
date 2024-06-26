autanac.define('mail.systray.MessagingMenuTests', function (require) {
"use strict";

var DocumentThread = require('mail.model.DocumentThread');
var MessagingMenu = require('mail.systray.MessagingMenu');
var mailTestUtils = require('mail.testUtils');

var testUtils = require('web.test_utils');

QUnit.module('mail', {}, function () {
QUnit.module('MessagingMenu', {
    beforeEach: function () {
        // patch _.debounce and _.throttle to be fast and synchronous
        this.underscoreDebounce = _.debounce;
        this.underscoreThrottle = _.throttle;
        _.debounce = _.identity;
        _.throttle = _.identity;

        this.data = {
            'mail.channel': {
                fields: {
                    name: {
                        string: "Name",
                        type: "char",
                        required: true,
                    },
                    channel_type: {
                        string: "Channel Type",
                        type: "selection",
                    },
                    channel_message_ids: {
                        string: "Messages",
                        type: "many2many",
                        relation: 'mail.message'
                    },
                },
                records: [{
                    id: 1,
                    name: "general",
                    channel_type: "channel",
                    channel_message_ids: [1],
                }],
            },
            'mail.message': {
                fields: {
                    body: {
                        string: "Contents",
                        type: 'html',
                    },
                    author_id: {
                        string: "Author",
                        type: 'many2one',
                        relation: 'res.partner',
                    },
                    channel_ids: {
                        string: "Channels",
                        type: 'many2many',
                        relation: 'mail.channel',
                    },
                    starred: {
                        string: "Starred",
                        type: 'boolean',
                    },
                    needaction: {
                      string: "Need Action",
                      type: 'boolean',
                    },
                    needaction_partner_ids: {
                        string: "Needaction partner IDs",
                        type: 'one2many',
                        relation: 'res.partner',
                    },
                    starred_partner_ids: {
                      string: "partner ids",
                      type: 'integer',
                    }
                },
                records: [{
                    id: 1,
                    author_id: ['1', 'Me'],
                    body: '<p>test</p>',
                    channel_ids: [1],
                }],
            },
            initMessaging: {
                channel_slots: {
                    channel_channel: [{
                        id: 1,
                        channel_type: "channel",
                        name: "general",
                    }],
                },
            },
        };
        this.services = mailTestUtils.getMailServices();
    },
    afterEach: function () {
        // unpatch _.debounce and _.throttle
        _.debounce = this.underscoreDebounce;
        _.throttle = this.underscoreThrottle;
    }
});

QUnit.test('messaging menu widget: menu with no records', async function (assert) {
    assert.expect(1);

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
            services: this.services,
            mockRPC: function (route, args) {
                if (args.method === 'message_fetch') {
                    return Promise.resolve([]);
                }
                return this._super.apply(this, arguments);
            }
        });
    await messagingMenu.appendTo($('#qunit-fixture'));
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    assert.hasClass(messagingMenu.$('.o_no_activity'),'o_no_activity', "should not have instance of widget");
    messagingMenu.destroy();
});

QUnit.test('messaging menu widget: messaging not ready', async function (assert) {
    assert.expect(8);

    const messagingReadyProm = testUtils.makeTestPromise();

    const messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        async mockRPC(route, args) {
            if (route === '/mail/init_messaging') {
                const _super = this._super.bind(this, ...arguments); // limitation of class.js
                assert.step('/mail/init_messaging:pending');
                await messagingReadyProm;
                assert.step('/mail/init_messaging:resolved');
                return _super();
            }
            if (args.method === 'message_fetch') {
                return [];
            }
            return this._super(...arguments);
        },
    });
    await messagingMenu.appendTo($('#qunit-fixture'));
    assert.verifySteps(['/mail/init_messaging:pending']);
    assert.ok(
        messagingMenu.el,
        "messaging menu should be rendered");
    assert.strictEqual(
        document.querySelector('.o_mail_systray_item'),
        messagingMenu.el,
        "should display messaging menu even when messaging is not ready");
    assert.hasClass(
        messagingMenu.$('.o_mail_messaging_menu_icon'),
        'fa-spinner',
        "Messaging menu icon should be a spinner when messaging menu is not ready");

    messagingReadyProm.resolve();
    await testUtils.nextTick();
    assert.verifySteps(['/mail/init_messaging:resolved']);
    assert.doesNotHaveClass(
        messagingMenu.$('.o_mail_messaging_menu_icon'),
        'fa-spinner',
        "Messaging menu icon should no longer be a spinner when messaging menu is ready");

    messagingMenu.destroy();
});

QUnit.test('messaging menu widget: messaging menu with 1 record', async function (assert) {
    assert.expect(3);
    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
    });
    await messagingMenu.appendTo($('#qunit-fixture'));

    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    assert.containsOnce(messagingMenu, '.o_mail_preview',
        "should display a preview");
    assert.strictEqual(messagingMenu.$('.o_preview_name').text().trim(), "general",
        "should display correct name of channel in preview");

    // remove any space-character inside text
    var lastMessagePreviewText =
        messagingMenu.$('.o_last_message_preview').text().replace(/\s/g, "");
    assert.strictEqual(lastMessagePreviewText,
        "Me:test",
        "should display correct last message preview in channel preview");

    messagingMenu.destroy();
});

QUnit.test('messaging menu widget: open inbox for needaction not linked to any document', async function (assert) {
    assert.expect(4);

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: {
            partner_id: 1,
        },
    });
    await messagingMenu.appendTo($('#qunit-fixture'));

    // Simulate received needaction message without associated document,
    // so that we have a message in inbox without a model and a resID
    var message = {
        id: 2,
        author_id: [1, "Me"],
        body: '<p>test</p>',
        channel_ids: [],
        needaction_partner_ids: [1],
    };
    var notifications = [
        [['myDB', 'ir.needaction'], message]
    ];
    messagingMenu.call('bus_service', 'trigger', 'notification', notifications);

    // Open messaging menu
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    var $firstChannelPreview =
        messagingMenu.$('.o_mail_preview').first();

    assert.strictEqual($firstChannelPreview.length, 1,
        "should have at least one channel preview");
    assert.strictEqual($firstChannelPreview.data('preview-id'),
        'mailbox_inbox',
        "should be a preview from channel inbox");

    testUtils.mock.intercept(messagingMenu, 'do_action', function (ev) {
        if (ev.data.action === 'mail.action_discuss') {
            assert.step('do_action:' + ev.data.action + ':' + ev.data.options.active_id);
        }
    }, true);
    await testUtils.dom.click($firstChannelPreview);
    assert.verifySteps(
        ['do_action:mail.action_discuss:mailbox_inbox'],
        "should open Discuss with Inbox");

    messagingMenu.destroy();
});

QUnit.test("messaging menu widget: mark as read on thread preview", async function ( assert ) {
    assert.expect(8);

    testUtils.mock.patch(DocumentThread, {
            markAsRead: function () {
                if (
                    this.getDocumentModel() === 'crm.lead' &&
                    this.getDocumentID() === 126
                ) {
                    assert.step('markedAsRead');
                }
            },
        });

    this.data['mail.message'].records = [{
        id: 10,
        channel_ids: ['mailbox_inbox'],
        res_id: 126,
        needaction: true,
        module_icon: "/crm/static/description/icon.png",
        date: "2018-04-05 06:37:26",
        subject: "Re: Interest in your Graphic Design Project",
        model: "crm.lead",
        body: "<span>Testing Messaging</span>"
    }];

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
    });

    await messagingMenu.appendTo($('#qunit-fixture'));
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    assert.hasClass(messagingMenu.$el,'o_mail_systray_item',
        'should be the instance of widget');
    assert.hasClass(messagingMenu.$el,'show',
        'MessagingMenu should be open');

    var $preview = messagingMenu.$('.o_mail_preview.o_preview_unread');
    assert.strictEqual($preview.length, 1,
        "should have one unread preview");
    assert.strictEqual($preview.data('document-model'), 'crm.lead',
        "should preview be linked to correct document model");
    assert.strictEqual($preview.data('document-id'), 126,
        "should preview be linked to correct document ID");
    assert.containsOnce(messagingMenu, '.o_mail_preview_mark_as_read',
        "should have mark as read icon next to preview");

    await testUtils.dom.click(messagingMenu.$(".o_mail_preview_mark_as_read"));

    assert.verifySteps(['markedAsRead'],
        "the document thread should be marked as read");

    testUtils.mock.unpatch(DocumentThread);
    messagingMenu.destroy();
});

QUnit.test('needaction messages in channels should appear, in addition to channel preview', async function (assert) {
    // Let's suppose a channel whose before-last message (msg1) is a needaction,
    // but not the last message (msg2). In that case, the systray messaging
    // menu should display the needaction message msg1 in the preview, and the
    // channel preview with the msg2.
    assert.expect(3);

    // simulate a needaction (mention) message in channel 'general'
    var partnerID = 44;
    var needactionMessage = {
        author_id: [1, "Demo"],
        body: "<p>@Administrator: ping</p>",
        channel_ids: [1],
        id: 3,
        model: 'mail.channel',
        needaction: true,
        needaction_partner_ids: [partnerID],
        record_name: 'general',
        res_id: 1,
    };
    var lastMessage = {
        author_id: [2, "Other"],
        body: "<p>last message content</p>",
        channel_ids: [1],
        id: 4,
        model: 'mail.channel',
        record_name: 'general',
        res_id: 1,
    };
    this.data['mail.message'].records = [needactionMessage, lastMessage];

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: {
            partner_id: partnerID,
        },
    });
    await messagingMenu.appendTo($('#qunit-fixture'));

    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    assert.containsN(messagingMenu, '.o_mail_preview', 2,
        "should display two previews");
    var $preview1 = messagingMenu.$('.o_mail_preview').eq(0);
    var $preview2 = messagingMenu.$('.o_mail_preview').eq(1);

    assert.strictEqual($preview1.find('.o_last_message_preview').text().replace(/\s/g, ""),
        "Demo:@Administrator:ping",
        "1st preview (needaction preview) should display needaction message");
    assert.strictEqual($preview2.find('.o_last_message_preview').text().replace(/\s/g, ""),
        "Other:lastmessagecontent",
        "2nd preview (channel preview) should display last message preview");

    messagingMenu.destroy();
});

QUnit.test('preview of message on a document + mark as read', async function (assert) {
    assert.expect(7);

    this.data.initMessaging = {
        needaction_inbox_counter: 1,
    };

    var partnerID = 44;
    var needactionMessage = {
        author_id: [1, "Demo"],
        body: "<p>*MessageOnDocument*</p>",
        id: 689,
        model: 'some.res.model',
        needaction: true,
        needaction_partner_ids: [partnerID],
        record_name: "Some Record",
        res_id: 1,
    };
    this.data['some.res.model'] = {
        fields: {
            message_ids: {string: 'Messages', type: 'one2many'},
        },
        records: [{
            id: 1,
            message_ids: [689],
        }],
    };
    this.data['mail.message'].records.push(needactionMessage);

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: {
            partner_id: partnerID,
        },
    });
    await messagingMenu.appendTo($('#qunit-fixture'));
    assert.strictEqual(messagingMenu.$('.o_notification_counter').text(), '1',
        "should display a counter of 1 on the messaging menu icon");

    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    assert.containsOnce(messagingMenu, '.o_mail_preview',
        "should display one preview");
    assert.strictEqual(messagingMenu.$('.o_mail_preview').data('preview-id'),
        "some.res.model_1",
        "preview should be the document thread preview");
    assert.hasClass(messagingMenu.$('.o_mail_preview:first'),'o_preview_unread',
        "document thread preview should be marked as unread");
    assert.strictEqual(messagingMenu.$('.o_preview_unread .o_last_message_preview').text().replace(/\s/g, ''),
        "Demo:*MessageOnDocument*", "should correctly display the preview");

    await testUtils.dom.click(messagingMenu.$('.o_mail_preview_mark_as_read'));
    assert.strictEqual(messagingMenu.$('.o_notification_counter').text(), '0',
        "should display a counter of 0 on the messaging menu icon");
    assert.containsNone(messagingMenu, '.o_mail_preview',
        "should not display any preview");

    messagingMenu.destroy();
});

QUnit.test('update messaging preview on receiving a new message in channel preview', async function (assert) {
    assert.expect(8);

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
    });
    await messagingMenu.appendTo($('#qunit-fixture'));

    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    assert.containsOnce(messagingMenu, '.o_mail_preview',
        "should display a single channel preview");
    assert.strictEqual(messagingMenu.$('.o_preview_name').text().trim(), "general",
        "should display channel preview of 'general' channel");
    assert.strictEqual(messagingMenu.$('.o_preview_counter').text().trim(), "",
        "should have unread counter of 0 for 'general' channel (no unread messages)");
    // remove any space-character inside text
    var lastMessagePreviewText =
        messagingMenu.$('.o_last_message_preview').text().replace(/\s/g, "");
    assert.strictEqual(lastMessagePreviewText,
        "Me:test",
        "should display author name and inline body of currently last message in the channel");

    // simulate receiving a new message on the channel 'general' (id 1)
    var data = {
        id: 100,
        author_id: [42, "Someone"],
        body: "<p>A new message content</p>",
        channel_ids: [1],
    };
    var notification = [[false, 'mail.channel', 1], data];
    messagingMenu.call('bus_service', 'trigger', 'notification', [notification]);
    await testUtils.nextTick();
    assert.containsOnce(messagingMenu, '.o_mail_preview',
        "should still display a single channel preview");
    assert.strictEqual(messagingMenu.$('.o_preview_name').text().trim(), "general",
        "should still display channel preview of 'general' channel");
    assert.strictEqual(messagingMenu.$('.o_preview_counter').text().trim(), "(1)",
        "should have incremented unread counter of 'general' channel");
    // remove any space-character inside text
    lastMessagePreviewText =
        messagingMenu.$('.o_last_message_preview').text().replace(/\s/g, "");
    assert.strictEqual(lastMessagePreviewText,
        "Someone:Anewmessagecontent",
        "should display author name and inline body of newly received message");

    messagingMenu.destroy();
});

QUnit.test('new message of type "notification" are not considered as unread messages', async function (assert) {
    assert.expect(8);

    const messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        data: this.data,
        services: this.services,
    });
    await messagingMenu.appendTo($('#qunit-fixture'));
    // open messaging menu
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    assert.containsOnce(
        messagingMenu,
        '.o_mail_preview',
        "should display a single channel preview");
    assert.strictEqual(
        messagingMenu
            .$('.o_preview_name')
            .text()
            .trim(),
        "general",
        "should display channel preview of 'general' channel");
    assert.strictEqual(
        messagingMenu
            .$('.o_preview_counter')
            .text()
            .trim(),
        "",
        "should have unread counter of 0 for 'general' channel (no unread messages)");
    assert.strictEqual(
        messagingMenu
            .$('.o_last_message_preview')
            .text()
            .replace(/\s/g, ""),
        "Me:test",
        "should display author name and inline body of currently last message in the channel");
    // close messaging menu
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    // simulate receiving a new message on the channel 'general' (id 1)
    // of type 'notification'
    const data = {
        id: 100,
        author_id: [42, "Someone"],
        body: "<p>Left #general</p>",
        channel_ids: [1],
        message_type: 'notification',
    };
    const notification = [[false, 'mail.channel', 1], data];
    messagingMenu.call('bus_service', 'trigger', 'notification', [notification]);
    await testUtils.nextTick();
    // open messaging menu
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    assert.containsOnce(
        messagingMenu,
        '.o_mail_preview',
        "should still display a single channel preview");
    assert.strictEqual(
        messagingMenu
            .$('.o_preview_name')
            .text()
            .trim(),
        "general",
        "should still display channel preview of 'general' channel");
    assert.strictEqual(
        messagingMenu
            .$('.o_preview_counter')
            .text()
            .trim(),
        "",
        "should still have unread counter of 0 for 'general' channel (no unread messages)");
    assert.strictEqual(
        messagingMenu
            .$('.o_last_message_preview')
            .text()
            .replace(/\s/g, ""),
        "Someone:Left#general",
        "should display author name and inline body of notification message (last message of channel)");

    messagingMenu.destroy();
});

QUnit.test('preview of inbox message not linked to document + mark as read', async function (assert) {
    assert.expect(17);

    this.data.initMessaging = {
        needaction_inbox_counter: 2,
    };

    var needactionMessages = [{
        author_id: [1, "Demo"],
        body: "<p>*Message1*</p>",
        id: 689,
        needaction: true,
        needaction_partner_ids: [44],
    }, {
        author_id: [1, "Demo"],
        body: "<p>*Message2*</p>",
        id: 690,
        needaction: true,
        needaction_partner_ids: [44],
    }];
    this.data['mail.message'].records =
        this.data['mail.message'].records.concat(needactionMessages);

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: {
            partner_id: 44,
        },
        mockRPC: function (route, args) {
            if (args.method === 'set_message_done') {
                assert.step('method: set_message_done, messageIDs: ' + JSON.stringify(args.args[0]));
            }
            return this._super.apply(this, arguments);
        },
    });
    await messagingMenu.appendTo($('#qunit-fixture'));
    assert.strictEqual(messagingMenu.$('.o_notification_counter').text(), '2',
        "should display a counter of 2 on the messaging menu icon");

    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    assert.strictEqual(messagingMenu.$('.o_mail_preview').length, 2,
        "should display two previews");

    var $preview1 = messagingMenu.$('.o_mail_preview').eq(0);
    var $preview2 = messagingMenu.$('.o_mail_preview').eq(1);

    assert.strictEqual($preview1.data('preview-id'),
        "mailbox_inbox",
        "1st preview should be from the mailbox inbox");
    assert.strictEqual($preview2.data('preview-id'),
        "mailbox_inbox",
        "2nd preview should also be from the mailbox inbox");
    assert.ok($preview1.hasClass('o_preview_unread'),
        "1st preview should be marked as unread");
    assert.ok($preview2.hasClass('o_preview_unread'),
        "2nd preview should also be marked as unread");
    assert.strictEqual($preview1.find('.o_last_message_preview').text().replace(/\s/g, ''),
        "Demo:*Message1*", "should correctly display the 1st preview");
    assert.strictEqual($preview2.find('.o_last_message_preview').text().replace(/\s/g, ''),
        "Demo:*Message2*", "should correctly display the 2nd preview");

    await testUtils.dom.click($preview1.find('.o_mail_preview_mark_as_read'));
    assert.verifySteps(['method: set_message_done, messageIDs: [689]'],
        "should mark 1st preview as read");
    assert.strictEqual(messagingMenu.$('.o_notification_counter').text(), '1',
        "should display a counter of 1 on the messaging menu icon after marking one preview as read");
    assert.strictEqual(messagingMenu.$('.o_mail_preview').length, 1,
        "should display a single preview remaining");
    assert.strictEqual(messagingMenu.$('.o_mail_preview .o_last_message_preview').text().replace(/\s/g, ''),
        "Demo:*Message2*", "preview 2 should be the remaining one");

    $preview2 = messagingMenu.$('.o_mail_preview');
    await testUtils.dom.click($preview2.find('.o_mail_preview_mark_as_read'));
    assert.verifySteps(['method: set_message_done, messageIDs: [690]'],
        "should mark 2nd preview as read");
    assert.strictEqual(messagingMenu.$('.o_notification_counter').text(), '0',
        "should display a counter of 0 on the messaging menu icon after marking both previews as read");
    assert.strictEqual(messagingMenu.$('.o_mail_preview').length, 0,
        "should display no preview remaining");

    messagingMenu.destroy();
});

QUnit.test('grouped preview for needaction messages linked to same document', async function (assert) {
    assert.expect(5);

    // simulate two (read) needaction (mention) messages in channel 'general'
    var needactionMessage1 = {
        author_id: [1, "Demo"],
        body: "<p>@Administrator: ping</p>",
        channel_ids: [1],
        id: 3,
        model: 'mail.channel',
        needaction: true,
        needaction_partner_ids: [44],
        record_name: 'general',
        res_id: 1,
    };
    var needactionMessage2 = {
        author_id: [2, "Other"],
        body: "<p>@Administrator: pong</p>",
        channel_ids: [1],
        id: 4,
        model: 'mail.channel',
        needaction: true,
        needaction_partner_ids: [44],
        record_name: 'general',
        res_id: 1,
    };
    this.data['mail.message'].records = [needactionMessage1, needactionMessage2];
    this.data.initMessaging.channel_slots.channel_channel[0].message_unread_counter = 0;
    this.data.initMessaging.needaction_inbox_counter = 2;

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: {
            partner_id: 44,
        },
    });
    await messagingMenu.appendTo($('#qunit-fixture'));

    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    var $previews = messagingMenu.$('.o_mail_preview');

    assert.strictEqual($previews.length, 2,
        "should display two previews (one for needaction, one for channel)");

    var $needactionPreview = $previews.eq(0);
    var $channelPreview = $previews.eq(1);

    assert.strictEqual($needactionPreview.find('.o_preview_counter').text().trim(), "(2)",
        "should show two needaction messages in the needaction preview");
    assert.strictEqual($needactionPreview.find('.o_last_message_preview').text().replace(/\s/g, ""),
        "Other:@Administrator:pong",
        "should display last needaction message on needaction preview");
    assert.strictEqual($channelPreview.find('.o_preview_counter').text().trim(), "",
        "should show no unread messages in the channel preview");
    assert.strictEqual($channelPreview.find('.o_last_message_preview').text().replace(/\s/g, ""),
        "Other:@Administrator:pong",
        "should display last needaction message on channel preview");

    messagingMenu.destroy();
});

QUnit.test("messaging menu widget: channel seen notification", async function (assert) {
    assert.expect(4);

    this.data.initMessaging.channel_slots = {
        channel_direct_message: [{
            id: 1,
            channel_type: "chat",
            direct_partner: [{ id: 2, name: 'Someone', im_status: '' }],
            name: 'DM',
            message_unread_counter: 1,
        }],
    };

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: { partner_id: 3 },
    });

    await messagingMenu.appendTo($('#qunit-fixture'));
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    assert.strictEqual(messagingMenu.$('.o_notification_counter').text(), '1',
        "should have correct messaging menu counter (1 unread message in channel)");
    assert.strictEqual(messagingMenu.$('.o_preview_counter').text().replace(/\s/g, ''),
        '(1)',
        "should display 1 unread message on DM channel preview");

    // Simulate received channel seen notification
    var message = {
        info: 'channel_seen',
        last_message_id: 1,
        partner_id: 3,
    };
    var notifications = [
        [['myDB', 'mail.channel', 1], message]
    ];
    messagingMenu.call('bus_service', 'trigger', 'notification', notifications);
    await testUtils.nextTick();
    assert.strictEqual(messagingMenu.$('.o_notification_counter').text(), '0',
        "should no longer have a messaging menu counter (no unread message in channel)");
    assert.strictEqual(messagingMenu.$('.o_preview_counter').text().replace(/\s/g, ''), '',
        "should no longer display unread message on DM channel preview");

    messagingMenu.destroy();
});

QUnit.test("messaging menu widget: no traceback when receiving channel_fetched notification with blank thread window", async function (assert) {
    assert.expect(3);

    this.data.initMessaging.channel_slots = {
        channel_direct_message: [{
            id: 1,
            channel_type: "chat",
            direct_partner: [{ id: 2, name: 'Someone', im_status: '' }],
            name: 'DM',
            message_unread_counter: 1,
        }],
    };

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: { partner_id: 3 },
    });

    await messagingMenu.appendTo($('#qunit-fixture'));
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    assert.containsOnce(messagingMenu, '.o_new_message',
        "should have button to open blank thread window");

    await testUtils.dom.click(messagingMenu.$('.o_new_message'));
    var $threadWindow = $('.o_thread_window');
    assert.strictEqual($threadWindow.length, 1, "should have an open thread window");
    assert.ok($threadWindow.hasClass('o_thread_less'), "should be a blank thread window");

    // Simulate received channel fetched notification
    var message = {
        info: 'channel_fetched',
        last_message_id: 1,
        partner_id: 2,
    };
    var notifications = [
        [['myDB', 'mail.channel', 1], message]
    ];
    messagingMenu.call('bus_service', 'trigger', 'notification', notifications);
    await testUtils.nextTick();

    messagingMenu.destroy();
});

QUnit.test("messaging menu widget: preview with no message should be undated", async function ( assert ) {
    assert.expect(2);

    // remove any message on the channel
    this.data['mail.channel'].records[0].channel_message_ids = [];
    this.data['mail.message'].records[0].channel_ids = [];

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
    });

    await messagingMenu.appendTo($('#qunit-fixture'));
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    assert.strictEqual(messagingMenu.$('.o_mail_preview').length, 1,
        "should have two previews in messaging menu");

    assert.ok(_.isEmpty(messagingMenu.$('.o_mail_preview .o_last_message_date').text().trim()),
        "should have preview as undated");

    messagingMenu.destroy();
});

QUnit.test("messaging menu widget: sort dated previews before undated previews", async function ( assert ) {
    assert.expect(5);

    var dm = {
        id: 2,
        name: "DM",
        channel_type: "chat",
    };

    this.data['mail.channel'].records.push(dm);
    this.data.initMessaging.channel_slots.direct_message = [dm];

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
    });

    await messagingMenu.appendTo($('#qunit-fixture'));
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    assert.strictEqual(messagingMenu.$('.o_mail_preview').length, 2,
        "should have two previews in messaging menu");

    var $preview1 = messagingMenu.$('.o_mail_preview').eq(0);
    var $preview2 = messagingMenu.$('.o_mail_preview').eq(1);

    assert.strictEqual($preview1.data('preview-id'), 1,
        "should have channel preview as the 1st preview (dated preview)");
    assert.notOk(_.isEmpty($preview1.find('.o_last_message_date').text().trim()),
        "should have channel preview as dated");
    assert.strictEqual($preview2.data('preview-id'), 2,
        "should have DM preview as the 1st preview (non-dated preview)");
    assert.ok(_.isEmpty($preview2.find('.o_last_message_date').text().trim()),
        "should have DM preview as undated");

    messagingMenu.destroy();
});

QUnit.test('global counter with channel previews', async function (assert) {
    assert.expect(5);

    var channels = [{
        id: 1,
        name: "channel1",
        channel_type: "channel",
        channel_message_ids: [1, 2],
        message_unread_counter: 2,
    }, {
        id: 2,
        name: "channel2",
        channel_type: "channel",
        channel_message_ids: [3],
        message_unread_counter: 1,
    }, {
        id: 3,
        name: "channel3",
        channel_type: "channel",
        channel_message_ids: [4],
        message_unread_counter: 0,
    }];

    var messages = [{
        author_id: [1, "Demo"],
        body: "<p>message 1</p>",
        channel_ids: [1],
        id: 1,
        model: 'mail.channel',
        record_name: 'channel1',
        res_id: 1,
    }, {
        author_id: [1, "Demo"],
        body: "<p>message 2</p>",
        channel_ids: [1],
        id: 2,
        model: 'mail.channel',
        record_name: 'channel1',
        res_id: 1,
    }, {
        author_id: [1, "Demo"],
        body: "<p>message 3</p>",
        channel_ids: [2],
        id: 3,
        model: 'mail.channel',
        record_name: 'channel2',
        res_id: 2,
    }, {
        author_id: [1, "Demo"],
        body: "<p>message 4</p>",
        channel_ids: [3],
        id: 4,
        model: 'mail.channel',
        record_name: 'channel3',
        res_id: 3,
    }];

    this.data['mail.channel'].records = channels;
    this.data.initMessaging.channel_slots.channel_channel = channels;
    this.data['mail.message'].records = messages;

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: {
            partner_id: 3,
        },
    });
    await messagingMenu.appendTo($('#qunit-fixture'));
    assert.strictEqual(messagingMenu.$('.o_notification_counter').text(), '2',
        "should display a counter of 2 on the messaging menu icon");
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));

    assert.strictEqual(messagingMenu.$('.o_mail_preview').length, 3,
        "should display 3 previews");
    var $previewChannel1 = messagingMenu.$('.o_mail_preview[data-preview-id=1]');
    var $previewChannel2 = messagingMenu.$('.o_mail_preview[data-preview-id=2]');
    var $previewChannel3 = messagingMenu.$('.o_mail_preview[data-preview-id=3]');

    assert.strictEqual($previewChannel1.data('unread-counter'), 2,
        "preview of channel 1 should have unread counter of 2");
    assert.strictEqual($previewChannel2.data('unread-counter'), 1,
        "preview of channel 2 should have unread counter of 1");
    assert.strictEqual($previewChannel3.data('unread-counter'), 0,
        "preview of channel 3 should have unread counter of 0");

    messagingMenu.destroy();
});

QUnit.test('messaging menu widget: do not open chat window twice on preview clicked', async function (assert) {
    // This test assumes that a condition for opening chat window is to
    // successfully fetch messages beforehand.
    assert.expect(4);

    var self = this;
    // Used to pause `message_fetch` after opening the messaging menu.
    // This is necessary `message_fetch` on mailbox_inbox is required to
    // display the previews.
    var lockMessageFetch = false;
    var messageFetchDef = testUtils.makeTestPromise();

    var messagingMenu = new MessagingMenu();
    testUtils.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: { partner_id: 1 },
        mockRPC: function (route, args) {
            if (args.method === 'message_fetch' && lockMessageFetch) {
                var _super = this._super.bind(this);
                return messageFetchDef.then(function () {
                    assert.step('message_fetch');
                    return _super(route, args);
                });
            }
            if (args.method === 'channel_minimize') {
                assert.step('channel_minimize');
                // called to detach thread in chat window
                // simulate longpolling response with new chat window state
                var channelInfo = _.extend({}, self.data['mail.channel'].records[0], {
                    is_minimized: true,
                    state: 'open',
                });
                var notifications = [ [['myDB', 'res.partner'], channelInfo] ];
                messagingMenu.call('bus_service', 'trigger', 'notification', notifications);
            }
            return this._super.apply(this, arguments);
        },
    });
    await messagingMenu.appendTo($('#qunit-fixture'));

    // Opening chat window from messaging menu (pending from `messageFetchDef`)
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    lockMessageFetch = true;
    await testUtils.dom.click(messagingMenu.$('.o_mail_preview'));
    messageFetchDef.resolve();

    await testUtils.nextTick();
    assert.strictEqual($('.o_thread_window').length, 1,
        "should only display a single chat window");
    assert.verifySteps([
        'message_fetch',
        'channel_minimize',
    ], "should have fetched messages only once");

    messagingMenu.destroy();
});

QUnit.test('messaging menu widget: expand on thread preview', async function (assert) {
    assert.expect(4);

    this.data['mail.message'].records.push({
        author_id: [1, "Demo"],
        body: "<p>Office Design Project</p>",
        res_id: 123,
        model: 'some.res.model',
        needaction: true,
        needaction_partner_ids: [44],
    });

    var messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: { partner_id: 44 },
        intercepts: {
            do_action: function (ev) {
                const { res_model, res_id } = ev.data.action;
                if (res_model === 'some.res.model' && res_id === 123) {
                    assert.step('open_document');
                }
            },
        },
    });
    await messagingMenu.appendTo($('#qunit-fixture'));

    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    var $preview = messagingMenu.$('.o_mail_preview');
    assert.containsOnce(messagingMenu, '.o_thread_window_expand', "should display one preview");
    assert.strictEqual($preview.data('document-model'), "some.res.model", "preview should be from some.res.model");

    await testUtils.dom.click($preview.find('.o_thread_window_expand'));
    assert.verifySteps(['open_document']);

    messagingMenu.destroy();
});

QUnit.test('messaging menu widget: click twice preview on slow message_fetch should open chat window once', async function (assert) {
    // This test assumes that a condition for opening chat window is to
    // successfully fetch messages beforehand.
    assert.expect(1);

    const self = this;
    // Used to pause `message_fetch` after opening the messaging menu.
    // This is necessary `message_fetch` on mailbox_inbox is required to
    // display the previews.
    let lockMessageFetch = false;
    const messageFetchProm = testUtils.makeTestPromise();

    const messagingMenu = new MessagingMenu();
    testUtils.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
        session: { partner_id: 1 },
        async mockRPC(route, args) {
            if (args.method === 'message_fetch' && lockMessageFetch) {
                const _super = this._super.bind(this);
                await messageFetchProm;
                return _super(route, args);
            }
            if (args.method === 'channel_minimize') {
                // called to detach thread in chat window
                // simulate longpolling response with new chat window state
                const channelInfo = {
                    ...self.data['mail.channel'].records[0],
                    is_minimized: true,
                    state: 'open',
                };
                const notifications = [ [['myDB', 'res.partner'], channelInfo] ];
                messagingMenu.call('bus_service', 'trigger', 'notification', notifications);
            }
            return this._super(...arguments);
        },
    });
    await messagingMenu.appendTo($('#qunit-fixture'));

    // Opening chat window 1st time from messaging menu (pending from `messageFetchDef`)
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    lockMessageFetch = true;
    await testUtils.dom.click(messagingMenu.$('.o_mail_preview'));
    // Click again on preview to open chat window
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    await testUtils.dom.click(messagingMenu.$('.o_mail_preview'));
    messageFetchProm.resolve();
    await testUtils.nextTick();

    assert.containsOnce(
        $,
        '.o_thread_window',
        "should only display a single chat window");

    messagingMenu.destroy();
});

QUnit.test('no code injection in message body preview', async function (assert) {
    assert.expect(4);

    this.data['mail.message'].records[0].body =
        `<p><script>throw new Error('CodeInjectionError');</script></p>`;

    const messagingMenu = new MessagingMenu();
    testUtils.mock.addMockEnvironment(messagingMenu, {
        services: this.services,
        data: this.data,
    });
    await messagingMenu.appendTo($('#qunit-fixture'));
    await testUtils.dom.click(messagingMenu.$('.dropdown-toggle'));
    assert.containsOnce(
        messagingMenu,
        '.o_mail_preview',
        "should display a preview"
    );
    assert.strictEqual(
        messagingMenu.$('.o_preview_name').text().trim(),
        "general",
        "should display correct name of channel in preview"
    );
    assert.strictEqual(
        messagingMenu.$('.o_last_message_preview').text().replace(/\s/g, ""),
        "Me:thrownewError('CodeInjectionError');",
        "should display correct uninjected last message inline content"
    );
    assert.containsNone(
        messagingMenu.$('.o_last_message_preview'),
        'script',
        "last message inline content should not have any code injection"
    );

    messagingMenu.destroy();
});

});
});
