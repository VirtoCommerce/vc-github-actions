# katalon-studio-github-action

Execute Katalon Studio projects

> Katalon TestOps CI is an easier way to execute Katalon Studio tests remotely or schedule remote Katalon Studio execution. [Learn more](https://docs.katalon.com/katalon-analytics/docs/kt-remote-execution.html)

## inputs:

### version:

    description: 'Which version of Katalon Studio to run'
    required: true
    default: ''

### projectPath:

    description: 'Where the Katalon Studio project is checked out'
    required: true
    default: ''

### args:

    description: 'What arguments to run Katalon Studio project'
    required: true
    default: ''

### xvfbConfiguration:

    description: 'Configuration for Xvfb'
    required: false
    default: '-a -n 99 -s "-screen 99 1920x1080x24"'

## Example of usage

Setup API Key using Secret name: `API_KEY`.

```yaml
- name: Katalon Studio Github Action
  uses: VirtoCommerce/vc-github-actions/katalon-studio-github-action@master
  with:
    version: '7.5.5'
    projectPath: '${{ github.workspace }}'
    args: '-noSplash -retry=0 -testSuiteCollectionPath="Test Suites/Simple Test Suite Collection" -apiKey= ${{ secrets.API_KEY }} --config -webui.autoUpdateDrivers=true'
```

## Compile action

Use @vercel/ncc tool to compile your code and modules into one file used for distribution.

- Install vercel/ncc by running this command in your terminal.

```bash
npm i -g @vercel/ncc
```

- Compile your index.ts file.

```bash
ncc build ./src/index.ts --license licenses.txt
```
