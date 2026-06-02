import { createReactBlockSpec } from '@blocknote/react';

export function safeCreateReactBlockSpec(config: any, implementation: any) {
  const spec = createReactBlockSpec(config, implementation);

  if (spec && spec.implementation && spec.implementation.node) {
    const node = spec.implementation.node;
    if (node.config && node.config.addNodeView) {
      const originalAddNodeView = node.config.addNodeView;

      node.config.addNodeView = function (this: any) {
        const tipTapEditor = this.editor;
        const editor = this.options.editor;

        // Mock editor.getBlock if it hasn't been mocked yet
        if (editor && !editor._isGetBlockMocked) {
          editor._isGetBlockMocked = true;
          const originalGetBlock = editor.getBlock;
          editor.getBlock = function (this: any, id: string) {
            if (id === 'safe-dummy-id') {
              return {
                id: 'safe-dummy-id',
                type: config.type,
                props: {
                  textAlignment: 'left',
                  textColor: 'default',
                  language: 'javascript',
                  url: '',
                },
                content: [],
              };
            }
            return originalGetBlock.call(this, id);
          };
        }

        try {
          const originalNodeViewFn = originalAddNodeView.call(this);

          return (props: any) => {
            const originalGetPos = props.getPos;

            props.getPos = () => {
              try {
                if (typeof originalGetPos !== 'function') {
                  return 0;
                }
                const pos = originalGetPos();
                if (pos === undefined || pos === null || typeof pos !== 'number') {
                  // Mock the resolve method on the current doc
                  if (tipTapEditor && tipTapEditor.state && tipTapEditor.state.doc) {
                    const doc = tipTapEditor.state.doc;
                    const originalResolve = doc.resolve;
                    doc.resolve = function (this: any, resolvedPos: any) {
                      if (resolvedPos === 0) {
                        return {
                          node: () => ({
                            attrs: {
                              id: 'safe-dummy-id',
                            },
                          }),
                          depth: 0,
                          pos: 0,
                        };
                      }
                      return originalResolve.call(this, resolvedPos);
                    };
                  }
                  return 0;
                }
                return pos;
              } catch (e) {
                return 0;
              }
            };

            try {
              return originalNodeViewFn(props);
            } catch (err) {
              console.warn('Caught NodeView execution error, returning safe DOM:', err);
              const dom = document.createElement('div');
              dom.className = 'bn-block-content bn-safe-fallback';
              return {
                dom,
                update: () => false,
                destroy: () => {},
              };
            }
          };
        } catch (e) {
          console.warn('Caught NodeView initialization error:', e);
          return (_props: any) => {
            const dom = document.createElement('div');
            dom.className = 'bn-block-content bn-safe-fallback';
            return {
              dom,
              update: () => false,
              destroy: () => {},
            };
          };
        }
      };
    }
  }

  return spec;
}
