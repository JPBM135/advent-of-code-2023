import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';
import { createPromptModule } from 'inquirer';
const colors = {
    toRed: (text)=>`\u001B[31m${text}\u001B[0m`,
    toGreen: (text)=>`\u001B[32m${text}\u001B[0m`,
    toYellow: (text)=>`\u001B[33m${text}\u001B[0m`,
    toBlue: (text)=>`\u001B[34m${text}\u001B[0m`
};
const daysPathUrl = new URL('../days/', import.meta.url);
const daysPath = daysPathUrl.pathname;
console.log(daysPath);
const prompt = createPromptModule();
const questions = [
    {
        type: 'list',
        name: 'type',
        message: 'What do you want to do?',
        choices: [
            {
                name: 'Build and run latest',
                value: 'build-and-run-latest'
            },
            {
                name: 'Build and run an specific day',
                value: 'build-and-run-specific'
            },
            {
                name: 'Add a new day',
                value: 'new'
            },
            {
                name: 'Watch and build an specific day',
                value: 'build-all'
            },
            {
                name: 'Exit',
                value: 'exit'
            }
        ]
    }
];
const choice = await prompt(questions);
if (choice.type === 'exit') {
    process.exit(0);
}
if (choice.type === 'new') {
    const alreadyCreatedDays = await readdir(daysPath);
    const latestDay = alreadyCreatedDays.sort((a, b)=>Number(b) - Number(a))[0] ?? null;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const paddedNextDay = String(Number(latestDay || -1) + 1).padStart(2, '0');
    console.log(`${colors.toBlue('[INFO]: Latest day:')} ${latestDay}`);
    console.log(`${colors.toBlue('[INFO]: Next day:')} ${paddedNextDay}`);
    mkdirSync(`${daysPath}${paddedNextDay}`);
    writeFileSync(`${daysPath}${paddedNextDay}/index.ts`, `console.log('Welcome to day ${paddedNextDay}');`);
    console.log(`${colors.toGreen('[SUCCESS]:')} Day ${paddedNextDay} created!`);
    process.exit(0);
}
if (choice.type === 'build-and-run-specific' || choice.type === 'build-and-run-latest') {
    const existingDays = await readdir(daysPath).then((folderFiles)=>{
        return folderFiles.filter((path)=>!Number.isNaN(Number(path)));
    });
    const { day  } = choice.type.endsWith('specific') ? await prompt([
        {
            type: 'input',
            name: 'day',
            message: 'What day do you want to build?',
            validate: (input)=>{
                const paddedDay = input.padStart(2, '0');
                const dayExists = existingDays.includes(paddedDay);
                return dayExists ? true : `Day ${paddedDay} doesn't exist`;
            }
        }
    ]) : {
        day: existingDays.at(-1)
    };
    const paddedDay = day.padStart(2, '0');
    spawnSync('swc', [
        `${daysPath}/logger.ts`,
        '--out-dir',
        `${daysPath}/../dist`
    ], {
        stdio: 'inherit'
    });
    spawnSync('swc', [
        `${daysPath}${paddedDay}/index.ts`,
        '--out-dir',
        `${daysPath}/../dist`
    ], {
        stdio: 'inherit'
    });
    console.log(`${colors.toGreen('[SUCCESS]:')} Day ${paddedDay} built!`);
    console.log(`${colors.toBlue('[INFO]:')} Running day ${paddedDay}...`);
    console.log(`${colors.toBlue('[OUTPUT]:')} -------------------------------------`);
    spawnSync('node', [
        '--enable-source-maps',
        `${daysPath}/../dist/${paddedDay}/index.js`
    ], {
        stdio: 'inherit'
    });
    console.log(`${colors.toBlue('[OUTPUT]:')} -------------------------------------`);
    console.log(`${colors.toGreen('[SUCCESS]:')} Day ${paddedDay} run!`);
    process.exit(0);
}

//# sourceMappingURL=cli.js.map