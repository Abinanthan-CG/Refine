import { defaultProps } from '@blocknote/core';
import { safeCreateReactBlockSpec } from './safeBlockSpec';

const headingPropSchema = {
  textAlignment: defaultProps.textAlignment,
  textColor: defaultProps.textColor,
};

export const Heading4Block = safeCreateReactBlockSpec(
  {
    type: 'heading4',
    propSchema: headingPropSchema,
    content: 'inline',
  },
  {
    render: (props) => <h4 className="refine-h4" ref={props.contentRef} data-text-alignment={props.block.props.textAlignment} />,
  }
);

export const Heading5Block = safeCreateReactBlockSpec(
  {
    type: 'heading5',
    propSchema: headingPropSchema,
    content: 'inline',
  },
  {
    render: (props) => <h5 className="refine-h5" ref={props.contentRef} data-text-alignment={props.block.props.textAlignment} />,
  }
);

export const Heading6Block = safeCreateReactBlockSpec(
  {
    type: 'heading6',
    propSchema: headingPropSchema,
    content: 'inline',
  },
  {
    render: (props) => <h6 className="refine-h6" ref={props.contentRef} data-text-alignment={props.block.props.textAlignment} />,
  }
);
