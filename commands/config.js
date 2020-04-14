exports.description = "Changes server's configuration settings. Running command without arguments prints further help about each module.";
exports.usage = '<module name> <further settings>';
exports.level = 100;
exports.perms = ['ADMINISTRATOR', 'MANAGE_GUILD'];
exports.cooldown = 3000;
exports.dmable = false;

exports.run = async message => {
    let data = client.go[message.guild.id].config;
    let colors = {
        native: 0xda7678,
        success: 0x51d559
    }
    let embed = {
        color: colors.native,
        timestamp: message.createdAt,
        footer: {
            text: message.author.tag,
            icon_url: message.author.avatarURL({format:'png', 'dynamic':true})
        },
        author: {
            name: 'Select one of the modules to change it\'s configuration'
        },
        description:
        '`prefix` - changes or restores bot\'s prefix'
        +'\n`leveling` - manages leveling system'
        +'\n`roles` - manages system of automatic role assignment via command'
        +'\n`logging` - manages logging system'
        +'\n`mod` - manages bot moderator roles and users',
        fields: [
            {
                name: 'Current brief config',
                value:
                `prefix - ${data.customprefix ? `**${data.customprefix}**` : `${message.prefix} (default)`}`
                +`\nleveling - ${data.modules.leveling.enabled ? '**enabled**' : 'disabled'}, ${Object.keys(data.modules.leveling.rewards).length} rewards; level-ups: ${data.modules.leveling.announcetype}`
                +`\nroles - ${data.modules.roles.enabled ? '**enabled**' : 'disabled'}, ${Object.keys(data.modules.roles.units).length} configured role(s)`
                +`\nlogging - ${data.modules.logging.enabled ? '**enabled**' : 'disabled'}, join/leave: ${data.modules.logging.joinleave ? `<#${data.modules.logging.joinleave}>` : 'none'}, ban/unban: ${data.modules.logging.banunban ? `<#${data.modules.logging.banunban}>` : 'none'}, message: ${data.modules.logging.message ? `<#${data.modules.logging.message}>` : 'none'}`
                +`\nmod - ${data.perms.length ? `**${data.perms.filter(p => p.type == 'role').length}** roles, **${data.perms.filter(p => p.type == 'user').length}** users` : 'Not configured.'}`
            }
        ]
    }
    if (message.args.length){
        embed.author.name = `${message.args[0].toLowerCase()} configuration, available options below`;
        switch(message.args[0].toLowerCase()){
            case 'prefix': await modulePrefix(); break;
            case 'leveling': await moduleLeveling(); break;
            case 'roles': await moduleRoles(); break;
            case 'logging': await moduleLogging(); break;
            case 'mod': await moduleModrole(); break;
        }
        async function modulePrefix(){
            embed.description = '`set <new_prefix>` - changes prefix to given value (no spaces)'
            +`\n\`reset\` - removes custom prefix (returns to default one: ${client.config.prefix})`;
            embed.fields = [
                {
                    name: 'note',
                    value: "After forgetting bot's prefix, just @Mention it in chat and it will respond to you with it's prefix for this server"
                }
            ];
            if (message.args[1]) switch(message.args[1].toLowerCase()){
                case 'set':
                    if (!message.args[2]) throw ['normal', 'You must specify new prefix!'];
                    data.customprefix = message.args[2].toLowerCase();
                    await updateConfig(`Successfully updated custom prefix to \`${data.customprefix}\``);
                    break;
                case 'reset':
                case 'delete':
                case 'clear':
                    data.customprefix = null;
                    await updateConfig(`Successfully deleted custom prefix.\nBot will now respond to default prefix: \`${client.config.prefix}\``, null);
                    break;
                default:
                    break;
            }
        }
        async function moduleLeveling(){
            embed.description = '`enable / disable` - toggles whole module'
            +'\n`type` - type of announcing level-up: embed, react, dm, none'
            +'\n`blacklist` - manages channel blacklist'
            +'\n`block` - manages list of users excluded from leveling'
            +'\n`rewards` - manages role rewards';
            embed.fields = [
                {
                    name: 'note',
                    value: 'use one of above options to get more help' //finish note
                }
            ];
            if (message.args[1]) switch(message.args[1].toLowerCase()){
                case 'enable':
                case 'true':
                    data.modules.leveling.enabled = true;
                    await updateConfig(`Leveling system is now **enabled**`, null);
                    break;
                case 'disable':
                case 'false':
                    data.modules.leveling.enabled = false;
                    await updateConfig(`Leveling system is now **disabled**`, null);
                    break;
                case 'type':
                        embed.description = '`embed` - shows level-up embed messages in current channel'
                        +'\n`react` - type of announcing level-up: embed, react, dm, none'
                        +'\n`dm` - sends level-up message directly to the user'
                        +'\n`none` - completely disables announcing level-ups'
                        embed.fields[0].value = `This option changes default bot's behavoir when someone levels up\nCurrent setting: \`${data.modules.leveling.announcetype}\``;
                        if (message.args[2]) switch(message.args[2].toLowerCase()){
                            case 'embed':
                                data.modules.leveling.announcetype = 'embed';
                                await updateConfig(`Changed type of level up announcements to **embed messages**`, null);
                                break;
                            case 'react':
                                data.modules.leveling.announcetype = 'react';
                                await updateConfig(`Changed type of level up announcements to **reactions**`, null);
                                break;
                            case 'dm':
                                data.modules.leveling.announcetype = 'dm';
                                await updateConfig(`Changed type of level up announcements to **direct messages**`, null);
                                break;
                            case 'none':
                                data.modules.leveling.announcetype = 'none';
                                await updateConfig(`**Disabled** level up announcements completely`, null);
                                break;
                        }
                    break;
                case 'blacklist':
                    embed.description = '`add <ID | #Channel>` - adds target channel to blacklist'
                    +'\n`remove <ID | #Channel>` - removes target channel from blacklist'
                    +'\n`clear` - clears blacklist restriction';
                    let blacklist = [];
                    data.modules.leveling.blacklist.forEach(chid => blacklist.push(`<#${chid}>`));
                    embed.fields[0].name = `Current list of channels that are excluded from gaining xp in them [${data.modules.leveling.blacklist.length}]`;
                    embed.fields[0].value = blacklist.length?blacklist.join('\n'):'There are no blacklisted channels.';
                    if (message.args[2]) switch(message.args[2].toLowerCase()){
                        case 'add':
                            if (!message.args[3]) throw ['normal', 'To blacklist a channel, #Mention it or specify it\'s ID!'];
                            if (message.mentions.channels.size){
                                if (message.guild.channels.cache.has(message.mentions.channels.firstKey()) && message.args[3].includes(message.mentions.channels.firstKey())){
                                    //success from mention
                                    data.modules.leveling.blacklist.push(message.mentions.channels.firstKey());
                                    await updateConfig(`Channel <#${message.mentions.channels.firstKey()}> (${message.mentions.channels.firstKey()}) has been **blacklisted**.`, null);
                                    break;
                                }
                                throw ['normal', 'Mentioned channel is not in this server!'];
                            }
                            if (!message.guild.channels.cache.has(message.args[3])) throw ['normal', 'Channel with given ID is not in this server!'];
                            //success from ID
                            data.modules.leveling.blacklist.push(message.args[3]);
                            await updateConfig(`Channel <#${message.args[3]}> (${message.args[3]}) has been **blacklisted**.`, null);
                            break;
                        case 'remove':
                            if (!message.args[3]) throw ['normal', 'To blacklist a channel, #Mention it or specify it\'s ID!'];
                            if (message.mentions.channels.size){
                                if (message.guild.channels.cache.has(message.mentions.channels.firstKey()) && message.args[3].includes(message.mentions.channels.firstKey())){
                                    //success from mention
                                    let index = data.modules.leveling.blacklist.indexOf(message.mentions.channels.firstKey());
                                    if (index > -1) data.modules.leveling.blacklist.splice(index, 1);
                                    await updateConfig(`Channel <#${message.mentions.channels.firstKey()}> (${message.mentions.channels.firstKey()}) has been **removed** from blacklist.`, null);
                                    break;
                                }
                                throw ['normal', 'Mentioned channel is not in this server!'];
                            }
                            if (!message.guild.channels.cache.has(message.args[3])) throw ['normal', 'Channel with given ID is not in this server!'];
                            //success from ID
                            let index = data.modules.leveling.blacklist.indexOf(message.args[3]);
                            if (index > -1) data.modules.leveling.blacklist.splice(index, 1);
                            await updateConfig(`Channel <#${message.args[3]}> (${message.args[3]}) has been **removed** from blacklist.`, null);
                            break;
                        case 'reset':
                        case 'clear':
                            data.modules.leveling.blacklist = [];
                            await updateConfig(`Channel blacklist has been cleared`, [{name: 'note', value: 'xp will be now granted for chatting in every channel, even spammy command ones'}]);
                            break;
                    }
                    break;
                case 'block':
                    embed.description = '`add <ID | @Mention>` - prevents target user from gaining xp'
                    +'\n`remove <ID | @Mention>` - removes leveling restriction from target user'
                    +'\n`clear` - removes leveling restriction from **all** users';
                    let blocked = data.modules.leveling.blocked.map(chid => `<@${chid}>`);
                    embed.fields[0].name = `Current list of users that are excluded from gaining xp`;
                    embed.fields[0].value = blocked.length ? blocked.join('\n') : 'There are no blocked users.';
                    if (message.args[2]) switch (message.args[2].toLowerCase()){
                        case 'add':
                            if (!message.args[3]) throw ['normal', 'Specify target user by their ID or @Mention them!'];
                            if (message.mentions.members.size){
                                if (message.guild.members.has(message.mentions.members.firstKey()) && message.args[3].includes(message.mentions.members.firstKey())){
                                    //success from mention
                                    data.modules.leveling.blocked.push(message.mentions.members.firstKey());
                                    await updateConfig(`User <@${message.mentions.members.firstKey()}> (${message.mentions.members.firstKey()}) has been **blocked** from gaining xp.`, null);
                                    break;
                                }
                                throw ['normal', 'Mentioned user is not in this server'];
                            }
                            if (!message.guild.members.has(message.args[3])) throw ['normal', 'User with specified ID is not in this server!']; 
                            //success from ID
                            data.modules.leveling.blocked.push(message.args[3]);
                            await updateConfig(`User <@${message.args[3]}> (${message.args[3]}) has been blocked from gaining xp.`, null);
                            break;
                        case 'remove':
                            if (!message.args[3]) throw ['normal', 'Specify target user by their ID or @Mention them!'];
                            if (message.mentions.members.size){
                                if (message.guild.members.has(message.mentions.members.firstKey()) && message.args[3].includes(message.mentions.members.firstKey())){
                                    //success from mention
                                    let index = data.modules.leveling.blocked.indexOf(message.mentions.members.firstKey());
                                    if (index > -1) data.modules.leveling.blocked.splice(index, 1);
                                    await updateConfig(`User <@${message.mentions.members.firstKey()}> (${message.mentions.members.firstKey()}) has been unblocked.`, null);
                                    break;
                                }
                                throw ['normal', 'Mentioned user is not in this server'];
                            }
                            if (!message.guild.members.has(message.args[3])) throw ['normal', 'User with specified ID is not in this server!']; 
                            //success from ID
                            let index = data.modules.leveling.blocked.indexOf(message.args[3]);
                            if (index > -1) data.modules.leveling.blocked.splice(index, 1);
                            await updateConfig(`User <@${message.args[3]}> (${message.args[3]}) has been unblocked from gaining xp.`, null);
                            break;
                        case 'reset':
                        case 'clear':
                            data.modules.leveling.blocked = [];
                            await updateConfig(`Removed leveling restriction from **all** users.`, [{name: 'note', value: 'Every user (except bots) should now be able to gain xp.'}]);
                            break;
                        default:
                            break;
                    }
                    break;
                case 'rewards':
                    embed.description = '`add <level> <ID | @Mention>` - adds target reward'
                    +'\n`remove <level> <ID | @Mention>` - removes target reward'
                    +'\n`reset` - removes all the rewards';
                    embed.fields[0].name = 'Currently configured rewards';
                    let roleRewards = data.modules.leveling.rewards;
                    let rewardLevels = Object.keys(roleRewards);
                    embed.fields[0].value = rewardLevels.map(rewLvl => `Level ${rewLvl}: <@&${roleRewards[rewLvl]}> (${roleRewards[rewLvl]})`).join('\n') || 'There are no rewards configured.';
                    //further configuration
                    if (message.args[2]) switch(message.args[2].toLowerCase()){
                        case 'add':
                            embed.fields = null;
                            if (!message.guild.me.hasPermission('MANAGE_ROLES')) throw ['botperm', 'Manage Roles'];
                            if (!message.args[3] || !message.args[4]) throw ['normal', 'Specify both level and role ID or @Mention!'];
                            if (!Number.isInteger(parseInt(message.args[3])) || message.args[3] < 0 || message.args[3] > 200) throw ['normal', 'Level must be a number between 1 and 200!'];
                            if (message.args[3] > 200) throw ['normal', 'Level rewards can not exceed level 200!'];
                            if (!message.guild.roles.cache.has(message.args[4])){
                                if (message.mentions.roles.size && message.args[4].includes(message.mentions.roles.firstKey())){
                                    roleRewards[message.args[3]] = message.mentions.roles.firstKey();
                                    await updateRole(message.mentions.roles.firstKey(), {added: true, lvl: message.args[3]});
                                    break;
                                }
                                throw ['normal', 'Specified role ID or @Mention is invalid!'];
                            }
                            roleRewards[message.args[3]] = message.args[4];
                            await updateRole(message.args[4], {added: true, lvl: message.args[3]});
                            break;
                        case 'remove':
                            embed.fields = null;
                            if (!message.guild.me.hasPermission('MANAGE_ROLES')) throw ['botperm', 'Manage Roles'];
                            if (!message.args[3] || !message.args[4]) throw ['normal', 'Specify both level and role ID or @Mention!!'];
                            if (!Number.isInteger(parseInt(message.args[3])) || message.args[3] < 0 || message.args[3] > 200) throw ['normal', 'Level must be a number between 1 and 200!'];
                            if (message.args[3] > 200) throw ['normal', 'Level rewards can not exceed level 200!'];
                            if (!message.guild.roles.cache.has(message.args[4])){
                                if (message.mentions.roles.size && message.args[4].includes(message.mentions.roles.firstKey())){
                                    delete roleRewards[message.args[3]];
                                    await updateRole(message.mentions.roles.firstKey(), {added: false, lvl: message.args[3]});
                                    break;
                                }
                                throw ['normal', 'Specified role ID or @Mention is invalid!'];
                            }
                            delete roleRewards[message.args[3]];
                            await updateRole(message.args[4], {added: false, lvl: message.args[3]});
                            break;
                        case 'reset':
                        case 'clear':
                            embed.fields = null;
                            roleRewards = {};
                            await updateConfig(`Cleared all role rewards`, null);
                            break;
                        }
                    break;
                default:
                    break;
            }
        }
        async function moduleRoles(){
            embed.description = '`enable / disable` - toggles whole module'
            +'\n`add <name> <roleID | @Role>` - adds a new role to module'
            +'\n`remove <name>` - removes existing role from module'
            +'\n`clear` - removes all roles from the module';
            embed.fields[0].name = 'Currently configured roles';
            embed.fields[0].value = `Module is **${data.modules.roles.enabled ? 'enabled' : 'disabled'}**\n${Object.keys(data.modules.roles.units).map(roleName => `${roleName}: <@&${data.modules.roles.units[roleName]}>`).join('\n')}`;
            // if (Object.keys(data.modules.roles.units).length){
            //     for (let i = 0; i < Object.keys(data.modules.roles.units).length; i++){
            //         currRoles = currRoles.concat(`${Object.keys(data.modules.roles.units)[i]}: <@&${data.modules.roles.units[Object.keys(data.modules.roles.units)[i]]}>\n`);
            //     }
            // }
            // else currRoles = 'No configured roles.';
            // currRoles = ('Module is '+(data.modules.roles.enabled?'**enabled**':'disabled'))+'\n'+currRoles;
            // embed.fields[0].value = currRoles;
            if (message.args[1]) switch(message.args[1].toLowerCase()){
                case 'enable':
                case 'true':
                    data.modules.roles.enabled = true;
                    await updateConfig(`Roles module is now **enabled**`, null);
                    break;
                case 'disable':
                case 'false':
                    data.modules.roles.enabled = false;
                    await updateConfig(`Roles module is now **disabled**`, null);
                    break;
                case 'add':
                    if (!message.guild.me.hasPermission('MANAGE_ROLES')) throw ['botperm', 'Manage Roles'];
                    if (!message.args[2] || !message.args[3]) throw ['normal', 'Specify both alias and role ID or @Mention'];
                    if (!message.guild.roles.cache.has(message.args[3])){
                        if (message.mentions.roles.size && message.args[3].includes(message.mentions.roles.firstKey())){
                            data.modules.roles.units[message.args[2]] = message.mentions.roles.firstKey();
                            roleCheck(message.mentions.roles.firstKey());
                            await updateConfig(`Successfully added role ${message.mentions.roles.first()} to autoassignment module with name \`${message.args[2]}\``, null);
                            break;
                        }
                        throw ['normal', 'Specified role ID or @Mention is invalid!'];
                    }
                    data.modules.roles.units[message.args[2]] = message.args[3];
                    roleCheck(message.args[3]);
                    await updateConfig(`Successfully added role <@&${message.args[3]}> to autoassignment module with name \`${message.args[2]}\``, null);
                    break;
                case 'remove':
                    if (!message.args[2]) throw ['normal', `Specify the role alias to delete! Check available aliases with \`${message.prefix}config roles\``];
                    if (!data.modules.roles.units[message.args[2]]) throw ['normal', 'Specified alias is invalid or it doesn\'t exist!'];
                    delete data.modules.roles.units[message.args[2]];
                    await updateConfig(`Removed role associated with name \`${message.args[2]}\` from autoassignment module`, null);
                    break;
                case 'clear':
                    data.modules.roles.units = {};
                    await updateConfig(`All roles has been excluded from autoassigning`, null);
                    break;
                default:
                    break;
            }
        }
        async function moduleLogging(){
            embed.description = '`enable / disable` - toggles whole module'
            +'\n`joinleave` - sets new log channel for join/leave events'
            +'\n`banunban` - sets new log channel for user bans/unbans events'
            +'\n`message` - sets new log channel for message edits/deletions events';
            embed.fields[0].name = 'Currently configured log channels';
            embed.fields[0].value = (data.modules.logging.enabled ? '**Enabled**' : '**Disabled**');
            +`\nJoin / Leave log channel: ${data.modules.logging.joinleave ? `<#${data.modules.logging.joinleave}> (${data.modules.logging.joinleave})` : ' None'}`
            +`\nBan/Unban log channel: ${data.modules.logging.banunban ? `<#${data.modules.logging.banunban}> (${data.modules.logging.banunban})` : ' None'}`
            +`\nMessage log channel: ${data.modules.logging.message ? `<#${data.modules.logging.message}> (${data.modules.logging.message})` : ' None'}`;
            if (message.args[1]) switch(message.args[1].toLowerCase()){
                case 'enable':
                case 'true':
                    data.modules.logging.enabled = true;
                    await updateConfig('Logging module is now **enabled**', null);
                    break;
                case 'disable':
                case 'false':
                    data.modules.logging.enabled = false;
                    await updateConfig('Logging module is now **disabled**', null);
                    break;
                case 'joinleave':
                    embed.description = '`set <channelID | #Channel>` - sets new Join/leave channel'
                    +'\n`clear` - stops logging Join/leave events';
                    embed.fields[0].name = 'Current setting';
                    embed.fields[0].value = data.modules.logging.joinleave ? `<#${data.modules.logging.joinleave}>` : 'Not configured.';
                    if (message.args[2]) switch(message.args[2].toLowerCase()){
                        case 'set':
                            if (!message.args[3]) throw ['normal', 'Specify join/leave log channel (via its ID or #Channel)'];
                            if (!message.guild.channels.cache.get(message.args[3])){
                                if (message.mentions.channels.size){
                                    if (message.guild.channels.cache.has(message.mentions.channels.firstKey())){
                                        if (message.mentions.channels.first().type != 'text') throw ['normal', 'This is not a text channel!'];
                                        data.modules.logging.joinleave = message.mentions.channels.firstKey();
                                        await updateConfig(`<#${message.mentions.channels.firstKey()}> is now Join/Leave log channel`, null);
                                        break;
                                    }
                                }
                                else throw ['normal', 'Mentioned channel is not in this server!'];
                            }
                            else {
                                if (message.guild.channels.cache.get(message.args[3]).type != 'text') throw ['normal', 'This is not a text channel!'];
                                data.modules.logging.joinleave = message.args[3];
                                await updateConfig(`<#${message.args[3]}> is now Join/Leave log channel`, null);
                            }
                            break;
                        case 'clear':
                        case 'reset':
                        case 'delete':
                            data.modules.logging.joinleave = null;
                            await updateConfig(`Stopped logging Join/Leave events`, null);
                            break;
                    }
                    break;
                case 'banunban':
                    embed.description = '`set <channelID | #Channel>` - sets new Ban/Unban channel'
                    +'\n`clear` - stops logging Ban/Unban events'
                    embed.fields[0].name = 'Current setting';
                    embed.fields[0].value = data.modules.logging.banunban ? `<#${data.modules.logging.banunban}>` : 'Not configured.';
                    if (message.args[2]) switch(message.args[2].toLowerCase()){
                        case 'set':
                            if (!message.args[3]) throw ['normal', 'Specify ban/unban log channel (via its ID or #Channel)'];
                            if (!message.guild.channels.cache.get(message.args[3])){
                                //Channel Mention
                                if (message.mentions.channels.size){
                                    if (message.guild.channels.cache.has(message.mentions.channels.firstKey())){
                                        if (message.mentions.channels.first().type != 'text') throw ['normal', 'This is not a text channel!'];
                                        data.modules.logging.banunban = message.mentions.channels.firstKey();
                                        await updateConfig(`<#${message.mentions.channels.firstKey()}> is now Ban/Unban log channel`, null);
                                        break;
                                    }
                                }
                                else throw ['normal', 'Mentioned channel is not in this server!'];
                            }
                            else {
                                //ID
                                if (message.guild.channels.cache.get(message.args[3]).type != 'text') throw ['normal', 'This is not a text channel!'];
                                data.modules.logging.banunban = message.args[3];
                                await updateConfig(`<#${message.args[3]}> is now Ban/Unban log channel`, null);
                            }
                            break;
                        case 'clear':
                        case 'reset':
                        case 'delete':
                            data.modules.logging.banunban = null;
                            await updateConfig('Stopped logging Ban/Unban events', null);
                            break;
                    }
                    break;
                case 'message':
                    embed.description = '`set <channelID | #Channel>` - sets new Message channel'
                    +'\n`clear` - stops logging Message events';
                    embed.fields[0].name = 'Current setting';
                    embed.fields[0].value = data.modules.logging.message ? `<#${data.modules.logging.message}>` : 'Not configured.';
                    if (message.args[2]) switch(message.args[2].toLowerCase()){
                        case 'set':
                            if (!message.args[3]) throw ['normal', 'Specify join/leave log channel (via its ID or #Channel)'];
                            if (!message.guild.channels.cache.get(message.args[3])){
                                if (message.mentions.channels.size){
                                    if (message.guild.channels.cache.has(message.mentions.channels.firstKey())){
                                        if (message.mentions.channels.first().type != 'text') throw ['normal', 'This is not a text channel!'];
                                        data.modules.logging.message = message.mentions.channels.firstKey();
                                        await updateConfig(`<#${message.mentions.channels.firstKey()}> is now Message log channel`, null);
                                        break;
                                    }
                                }
                                else throw ['normal', 'Mentioned channel is not in this server!'];
                            }
                            else {
                                if (message.guild.channels.cache.get(message.args[3]).type != 'text') throw ['normal', 'This is not a text channel!'];
                                data.modules.logging.message = message.args[3];
                                await updateConfig(`<#${message.args[3]}> is now Message log channel`, null);
                            }
                            break;
                        case 'clear':
                        case 'reset':
                        case 'delete':
                            data.modules.logging.message = null;
                            await updateConfig(`Stopped logging Message events`, null);
                            break;
                    }
                    break;
            }
        }
        async function moduleModrole(){
            // if (!message.member.hasPermission('ADMINISTRATOR') && !message.perms.isOwner()) throw ['normal', 'You need special permission to run that'];
            embed.description = '`set <@Mention | @Role | userID | roleID>` - sets specified role / user as a moderator (can be done with ID or @Mention)'
            +'\n`remove <@Mention | @Role | userID | roleID>` - removes specified role / user as a moderator (can be done with ID or @Mention)'
            +'\n`reset` - removes all moderator users and roles from configuration';
            if (!data.perms.length){
                //no permission entries
                embed.description += '\n\nThere are no moderator users or roles.';
                embed.fields = [];
            }
            else {
                //there are some permission entries specified
                if (data.perms.filter(perm => perm.type == 'role')){
                    embed.fields[0].name = 'Moderator Roles';
                    embed.fields[0].value = data.perms.filter(perm => perm.type == 'role').map(roleid => `<@&${roleid}>`).join(' ');
                }
                if (data.perms.filter(perm => perm.type == 'user')){
                    embed.fields[0].name = 'Moderator Users';
                    embed.fields[0].value = data.perms.filter(perm => perm.type == 'user').map(userid => `<@${userid}>`).join(' ');
                }
            }
            if (message.args[1]){
                switch(message.args[1].toLowerCase()){
                    case 'set':
                    case 'add': return await permSetRemove(true);
                    case 'delete':
                    case 'remove': return await permSetRemove(false);
                    case 'reset':
                    case 'clear':
                        if (!message.member.hasPermission('ADMINISTRATOR')) throw ['normal', 'Only server administrators can clear all moderator roles and users!'];
                        data.perms = [];
                        await updateConfig(`Successfully deleted **all** moderator roles and users from config`, null);
                        break;
                }
                async function permSetRemove(bool){
                    if (!message.args[2]) throw ['normal', 'You need to specify role or user by their ID or @Mention!'];
                    //mentioned a valid role
                    if (message.mentions.roles.size && message.args[2].includes(message.mentions.roles.firstKey())) return await permRoleCheck(message.mentions.roles.firstKey(), bool);
                    //provided a vaild role ID
                    if (message.guild.roles.cache.has(message.args[2])) return await permRoleCheck(message.args[2], bool);
                    //mentioned a valid member
                    if (message.mentions.users.size && message.args[2].includes(message.mentions.users.firstKey())) return await permMemberCheck(message.mentions.users.firstKey(), bool);
                    //provided a vaild member ID
                    if (message.guild.members.cache.has(message.args[2])) return await permMemberCheck(message.args[2], bool);
                    //nothing relevant was provided, throwing an error
                    throw ['normal', 'Specified role ID or @Mention is invalid!'];
                }
                async function permRoleCheck(roleID, boolSet){
                    if (message.guild.roles.cache.get(roleID).managed) throw ['normal', 'This is a Discord integration role, it can\'t be managed!'];
                    if (roleID == message.guild.id) throw ['normal', 'This is a default server role, you dummy. Pick another'];
                    if ((message.guild.owner.id != message.author.id) && (message.member.roles.highest.position <= message.guild.roles.cache.get(roleID))) {
                        throw ['normal', `You need a higher role to ${boolSet ? 'add' : 'remove'} this role as a server moderator!`]; }
                    if (boolSet){ if (!data.perms.map(p => p.id).includes(roleID)) data.perms.push({
                        id: roleID,
                        type: 'role',
                        level: 100
                    }); }
                    else {
                        let index = data.perms.map(perm => perm.id).indexOf(roleID);
                        if (index > -1) data.perms.splice(index, 1);
                    }
                    return await updateConfig(`${boolSet ? 'Added' : 'Removed'} <@&${roleID}> as a server moderator role`, null);
                }
                async function permMemberCheck(memberID, boolSet){
                    let member = message.guild.member(memberID);
                    console.log(message.guild.owner.id, message.author.id)
                    console.log(message.guild.owner.id != message.author.id)
                    if ((message.guild.owner.id != message.author.id) && (!client.perms.sufficientRole(message.member, member))) {
                        throw [`You need a higher role than this user to ${boolSet ? 'add' : 'remove'} them as server moderator!`]; }
                    if (boolSet){ if (!data.perms.map(p => p.id).includes(memberID)) data.perms.push({
                        id: memberID,
                        type: 'user',
                        level: 100
                    }); }
                    else {
                        let index = data.perms.map(perm => perm.id).indexOf(memberID);
                        if (index > -1) data.perms.splice(index, 1);
                    }
                    return await updateConfig(`${boolSet ? 'Added' : 'Removed'} ${member.user} as a server moderator`, null);
                }
            }
        }
    }
    function roleCheck(role){
        if (message.guild.roles.cache.get(role).position >= message.guild.me.roles.highest.position) throw ['normal', 'I can\'t add this role to other users. Change my permissions and try again!'];
        if (message.guild.roles.cache.get(role).managed) throw ['normal', 'This is a Discord integration role, it can\'t be managed!'];
        if (role == message.guild.id) throw ['normal', 'This is a default server role, you dummy. Pick another'];
    }
    async function updateRole(roleID, reward){
        roleCheck(roleID);
        if (!reward) data.modrole = roleID;
        await updateConfig(reward ? `Successfully ${reward.added ? 'added' : 'removed'} reward <@&${roleID}> (${roleID}) for level ${reward.lvl}`:`Successfully updated moderator role to <@&${roleID}> (${roleID})`);
    }
    async function updateConfig(msg, fields){
        await client.db.utils.replaceOne('guilds', {guildid: message.guild.id}, data);
        embed.color = colors.success;
        embed.author.name = 'Success!';
        embed.description = msg;
        if (fields || fields == null) embed.fields = fields;
    }
    message.channel.send({embed:embed});
}