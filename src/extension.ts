// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('生成代码插件已激活!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('flutter-gender-code-xq.genderCode', async (uri: vscode.Uri) => {
		if (!uri) {
			vscode.window.showErrorMessage('请先选择一个文件夹.');
			return;
		}

		// 让用户输入模块名称
		const moduleName = await vscode.window.showInputBox({
			prompt: '输入模块名称',
			placeHolder: '模块名称'
		});

		if (!moduleName) {
			vscode.window.showErrorMessage('模块名称是必填项.');
			return;
		}

		const folderPath = uri.fsPath;
		// 构建新文件夹的路径
        const moduleFolderPath = path.join(folderPath, toSnakeCaseName(moduleName));

		// 构建新文件夹的路径
        const widgetsFolderPath = path.join(moduleFolderPath, 'widgets');

		// 定义要生成的文件
		const filesToGenerate = [
			{ name: `bindings.dart`, content: generateBindingsFileContent(moduleName) },
			{ name: `controller.dart`, content: generateControllerFileContent(moduleName) },
			{ name: `index.dart`, content: generateIndexFileContent(moduleName) },
			{ name: `state.dart`, content: generateStateFileContent(moduleName) },
			{ name: `view.dart`, content: generateViewFileContent(moduleName) },
			{ name: `model.dart`, content: generateModelFileContent(moduleName) },
		];

		const widgetsFilesToGenerate = [
			{ name: `widgets.dart`, content: generateWidgetsFileContent(moduleName) },
			{ name: `hello.dart`, content: generateHelloFileContent(moduleName) },
		];

		try {
			// 创建新文件夹，如果文件夹已存在则不会报错
            fs.mkdirSync(moduleFolderPath, { recursive: true });
			fs.mkdirSync(widgetsFolderPath, { recursive: true });
			
			filesToGenerate.forEach(file => {
				const filePath = path.join(moduleFolderPath, file.name);
				fs.writeFileSync(filePath, file.content, 'utf8');
			});

			widgetsFilesToGenerate.forEach(file => {
				const filePath = path.join(widgetsFolderPath, file.name);
				fs.writeFileSync(filePath, file.content, 'utf8');
			});

			vscode.window.showInformationMessage(`成功生成 ${moduleName} 代码文件.`);
		} catch (error) {
			vscode.window.showErrorMessage(`生成 ${moduleName} 代码文件失败: ${(error as Error).message}`);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

function toSnakeCaseName(name: string): string {
	// 将驼峰命名转换为下划线小写
    const snakeCaseName = name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
	return snakeCaseName;
}

function generateBindingsFileContent(moduleName: string): string {
	const snakeCaseName = toSnakeCaseName(moduleName);
    return `
import 'package:get/get.dart';

import 'controller.dart';
import 'view.dart';

class ${moduleName}Binding implements Bindings {
  @override
  void dependencies() {
    Get.lazyPut<${moduleName}Controller>(() => ${moduleName}Controller());
  }

  static GetPage getPage() {
    return GetPage(
      name: '/${snakeCaseName}',
      page: () => const ${moduleName}Page(),
      binding: ${moduleName}Binding(),
    );
  }

}
`;
}

function generateControllerFileContent(moduleName: string): string {
    return `
import 'package:get/get.dart';

import 'index.dart';

class ${moduleName}Controller extends GetxController {
  final state = ${moduleName}State();

  void changeTitle() {
    state.model.value.onOff = !state.model.value.onOff;
    if (state.model.value.onOff) {
      state.model.value.title = "开列表";
    } else {
      state.model.value.title = "关列表";
    }
    // 更新列表视图
    state.model.refresh();
  }

  void removeItem() {
    if (state.items.isEmpty) {
      return;
    }
    state.items.removeLast();
  }

  void addItem() {
    state.items.add(${moduleName}ItemModel("${moduleName}标题", "新内容"));
  }

  void selectItem(int index) {
    state.items[index].isSelect = !state.items[index].isSelect;
    if (state.items[index].isSelect) {
      state.items[index].title = "${moduleName}选中";
    } else {
      state.items[index].title = "${moduleName}未选中";
    }
  }

  /// 在 widget 内存中分配后立即调用。
  @override
  void onInit() {
    super.onInit();
  }

  /// 在 onInit() 之后调用 1 帧。这是进入的理想场所
  @override
  void onReady() {
    super.onReady();
  }

  /// 在 [onDelete] 方法之前调用。
  @override
  void onClose() {
    super.onClose();
  }
}
	`;
}

function generateIndexFileContent(moduleName: string): string {
	const snakeCaseName = toSnakeCaseName(moduleName);
    return `

export './state.dart';
export './controller.dart';
export './bindings.dart';
export './view.dart';
export './model.dart';

	`;
}


function generateStateFileContent(moduleName: string): string {
    return `
import 'package:get/get.dart';
import 'model.dart';

class ${moduleName}State {
  // 也可以单独声明 rx 属性
  // final title = "".obs;

  final model = Rx(${moduleName}Model());

  RxList<${moduleName}ItemModel> items = <${moduleName}ItemModel>[].obs;
  
}
	`;
}

function generateViewFileContent(moduleName: string): string {
    return `
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import 'index.dart';
import 'widgets/widgets.dart';

class ${moduleName}Page extends GetView<${moduleName}Controller> {
  const ${moduleName}Page({super.key});

  // 主视图
  Widget _buildView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 监听标题变化
        Obx(() => Text(controller.state.model.value.title)),
        // 监听开关状态变化
        Obx(() => Switch(
            value: controller.state.model.value.onOff,
            onChanged: (value) {
              controller.changeTitle();
            })),
        Obx(
          () => controller.state.model.value.onOff
              ? Expanded(child: HelloWidget())
              : SizedBox(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<${moduleName}Controller>(
      init: ${moduleName}Controller(),
      builder: (_) {
        return Scaffold(
          appBar: AppBar(title: const Text("${moduleName}")),
          body: SafeArea(
            child: _buildView(),
          ),
        );
      },
    );
  }
}
	`;
}

function generateWidgetsFileContent(moduleName: string): string {
    return `
export './hello.dart';

	`;
}

function generateHelloFileContent(moduleName: string): string {
    return `
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../index.dart';

class HelloWidget extends GetView<${moduleName}Controller> {
  const HelloWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextButton(
            onPressed: () {
              controller.removeItem();
            },
            child: Text("删除")),
        TextButton(
            onPressed: () {
              controller.addItem();
            },
            child: Text("添加")),
        Expanded(
          // 监听数组变化
          child: Obx(() => ListView.builder(
                itemCount: controller.state.items.length,
                itemBuilder: (context, index) {
                  // 监听选择变化
                  return Obx(() => ListTile(
                        trailing: Switch(
                            value: controller.state.items[index].isSelect,
                            onChanged: (value) {
                              controller.selectItem(index);
                            }),
                        title: Text(controller.state.items[index].title),
                        subtitle: Text(controller.state.items[index].content),
                      ));
                },
              )),
        )
      ],
    );
  }
}

	`;
}

function generateModelFileContent(moduleName: string): string {
    return `
import 'package:get/get.dart';

// 视图状态 model
class ${moduleName}Model {
  ${moduleName}Model();

  String title = "关列表";
  bool onOff = false;
}

// 列表视图 item model
class ${moduleName}ItemModel {
  ${moduleName}ItemModel(this.title, this.content);

  String title;
  String content;
  final RxBool _isSelect = false.obs;
  get isSelect => _isSelect.value;
  set isSelect(value) => _isSelect.value = value;
}

  `;
}
