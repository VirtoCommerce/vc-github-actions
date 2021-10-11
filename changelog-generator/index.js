const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const utils = require('@virtocommerce/vc-actions-lib');

async function getCommitMessages(since)
{
    const format = "HASH: %h MSG:%Cgreen%s %Creset BODY: %Cred(%b)%Creset";
    
    let output = '';
    const options = {
        listeners : {
            stdout: (data) => {
                output += data.toString();
            },
            stderr: (data) => {
                console.log(data.toString());
            }
        }
    }

    await exec.exec(`git log --pretty=format:"${format}" --since="${since}"`, [], options)
              .then(exitCode => console.log(`git log --pretty=format:"${format}" --since exitCode: ${exitCode}`));

    return output.trim();
}

function cleanMessages(messages)
{
    let jiraTasksRegex = /^#*[A-Z]{2,5}-\d{1,5}:{0,1}\s*/mi;
    
    const releaseNoteGroups = [
        { key: "feat", items: [] },
        { key: "fix", items: [] },
        { key: "docs", items: [] },
        { key: "style", items: [] },
        { key: "refactor", items: [] },
        { key: "perf", items: [] },
        { key: "test", items: [] },
        { key: "ci", items: [] },
        { key: "chore", items: [] },
    ]

    // Collect messages in groups
    messages.split('HASH:')
        .forEach(commitMsg => {
            const oneLineMsg = commitMsg.replaceAll("\n","").replace(/\s+/g, ' ').trim();
            
            // Skip empty lines
            if (oneLineMsg === ""){return;}
            console.log(`Raw -> ${oneLineMsg}`);

            const msgAndBody = oneLineMsg.split('BODY:');
            const msg = msgAndBody[0].split('MSG:')[1].trim();
            const body = msgAndBody[1].trim();

            // Example message (PT-3771: Provide option to show user-friendly errors) 
            if (jiraTasksRegex.test(msg)) {

                // Feature-style commit
                if (jiraTasksRegex.test(body)) {
                    const message = msg.replace(jiraTasksRegex,'');

                    console.log(`FEAT -> ${message}`);
                    releaseNoteGroups[0].items.push(message);
                    console.log("----------");
                    
                    return;
                }

                const groupIndexes = [];
                releaseNoteGroups.forEach(group => {
                    const template = group.key + ': ';
                    let startIndex = 0;
                    while (startIndex < body.length) {
                        let templateIndex = body.indexOf(template, startIndex);
                        if (templateIndex !== -1) {
                            groupIndexes.push({key: group.key, index: templateIndex});
                        }
                        startIndex += template.length;
                    }
                })

                // Only text in body message => use message as source of truth
                if (groupIndexes.length === 0) {
                    const message = msg.replace(jiraTasksRegex,'');

                    console.log(`FEAT -> ${message}`);
                    releaseNoteGroups[0].items.push(message);
                    console.log("----------");

                    return;
                }

                // One match
                if (groupIndexes.length === 1) {
                    let key = groupIndexes[0].key;
                    const message = body.replace(key + ': ', '');

                    console.log(`${key.toUpperCase()} -> ${message}`);
                    releaseNoteGroups.find(group => group.key === key).items.push(message);
                    console.log("----------");

                    return;
                }

                // Sort by position
                groupIndexes.sort((indexGroupA, indexGroupB) => indexGroupA.index - indexGroupB.index);

                for (let i = 0; i < groupIndexes.length - 1; i++) {
                    const message = body
                        .substring(groupIndexes[i].index, groupIndexes[i + 1].index)
                        .replace(groupIndexes[i].key + ': ','');
                    
                    console.log(`${groupIndexes[i].key.toUpperCase()} -> ${message}`);
                    releaseNoteGroups.find(group => group.key === groupIndexes[i].key).items.push(message);
                    console.log("----------");
                }
            }
            else if(new RegExp("^(feat|fix|docs|style|refactor|perf|test|ci|chore):\\s").test(msg)) {
                
                releaseNoteGroups.forEach(group => {
                    const template = group.key + ': ';
                    if (!msg.startsWith(template)){ return; }
                    const message = msg.replace(template,'');

                    console.log(`${group.key.toUpperCase()} -> ${message}`);
                    group.items.push(message);
                    console.log("----------");
                })
            }
            else {
                // Skip commits without Jira-keys and commit pattern in the start
                console.log("SKIP");
                console.log("----------");
                
                return;
            }
        });

    // Build release-note string
    function generateGroup(title, items) {
        let result = `<h3>${title}</h3>`;
        result += "<ul>"
        items.forEach(item => result += `<li>${item}</li>`);
        result += "</ul>"

        return result;
    }

    let result = "";

    // Development
    const developmentItems = releaseNoteGroups.find(group => group.key === "feat").items;
    if (developmentItems.length > 0) {
        result += generateGroup("🎯 Development", developmentItems);
    }

    // Improvements (perf + refactor + test)
    const improvementItems = [
        ...releaseNoteGroups.find(group => group.key === "perf").items,
        ...releaseNoteGroups.find(group => group.key === "refactor").items,
        ...releaseNoteGroups.find(group => group.key === "test").items,
    ];
    if (improvementItems.length > 0) {
        result += generateGroup("📈 Improvements", improvementItems);
    }

    // Fixes
    const fixesItems = releaseNoteGroups.find(group => group.key === "fix").items;
    if (fixesItems.length > 0) {
        result += generateGroup("🐞 Bug fixes", fixesItems);
    }

    // Chore (style + chore)
    const choreItems = [
        ...releaseNoteGroups.find(group => group.key === "style").items,
        ...releaseNoteGroups.find(group => group.key === "chore").items
    ];
    if (choreItems.length > 0) {
        result += generateGroup("🗿 Chore", choreItems);
    }

    // Documentation
    const docsItems = releaseNoteGroups.find(group => group.key === "docs").items;
    if (docsItems.length > 0) {
        result += generateGroup("📝 Documentation", docsItems);
    }

    console.log(`Result: ${result}`);

    return result;
}

String.prototype.replaceAll = function (find, replace) 
{
    return this.split(find).join(replace);
}

async function run()
{
    let isDependencies = await utils.isDependencies(github);
    if (isDependencies) {
        console.log(`Pull request contain "dependencies" label. Step skipped.`);
        return;
    }

    let latestRelease = await utils.getLatestRelease(process.env.GITHUB_REPOSITORY);
    let commitMessages = "";
    if (latestRelease != null)
    {
        commitMessages = await getCommitMessages(latestRelease.published_at);
        commitMessages = cleanMessages(commitMessages);
    }

    console.log(commitMessages);
    core.setOutput("changelog", commitMessages);
}

run().catch(err => {
    core.setFailed(err.message);
});