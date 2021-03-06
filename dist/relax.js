"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const immutable_1 = require("immutable");
const is_array_1 = require("./util/is-array");
const is_string_1 = require("./util/is-string");
const ql_1 = require("./ql");
function RelaxContainer(Wrapper) {
    return _a = class Relax extends React.Component {
            constructor(props, context) {
                super(props);
                this._handleStoreChange = (state) => {
                    if (this._isMounted) {
                        this.setState({
                            storeState: state
                        });
                    }
                };
                this._isMounted = false;
                this._dql2QL = {};
                this.state = {
                    storeState: immutable_1.fromJS({})
                };
                //提前绑定事件，为了争取父子有序
                context._plume$Store.subscribe(this._handleStoreChange);
            }
            componentWillMount() {
                this._isMounted = false;
                //计算一次relaxProps
                this.relaxProps = this.computeRelaxProps(this.props);
                //will drop on production env       
                if (process.env.NODE_ENV != 'production') {
                    if (this.context['_plume$Store']._opts.debug) {
                        console.groupCollapsed(`${Relax.displayName} will mount 🚀`);
                        console.log('props:|>', JSON.stringify(this.props, null, 2));
                        console.log('relaxProps:|>', JSON.stringify(this.relaxProps, null, 2));
                        console.groupEnd();
                    }
                }
            }
            componentDidMount() {
                this._isMounted = true;
            }
            componentWillUpdate() {
                this._isMounted = false;
            }
            componentDidUpdate() {
                this._isMounted = true;
            }
            shouldComponentUpdate(nextProps) {
                const newRelaxProps = this.computeRelaxProps(nextProps);
                if (!immutable_1.is(immutable_1.fromJS(this.props), immutable_1.fromJS(nextProps)) ||
                    !immutable_1.is(immutable_1.fromJS(this.relaxProps), immutable_1.fromJS(newRelaxProps))) {
                    this.relaxProps = newRelaxProps;
                    if (process.env.NODE_ENV != 'production') {
                        if (this.context['_plume$Store']._opts.debug) {
                            console.groupCollapsed(`${Relax.displayName} will update 🚀`);
                            console.log('props:|>', JSON.stringify(this.relaxProps, null, 2));
                            console.log('relaxProps:|>', JSON.stringify(this.relaxProps, null, 2));
                            console.groupEnd();
                        }
                    }
                    return true;
                }
                else {
                    return false;
                }
            }
            componentWillUnmount() {
                this.context['_plume$Store'].unsubscribe(this._handleStoreChange);
            }
            render() {
                return React.createElement(Wrapper, Object.assign({}, this.props, { relaxProps: this.relaxProps }));
            }
            computeRelaxProps(props) {
                const relaxProps = {};
                const staticRelaxProps = Relax.relaxProps;
                const dqlMap = {};
                const store = this.context['_plume$Store'];
                for (let propName in staticRelaxProps) {
                    //prop的属性值
                    const propValue = staticRelaxProps[propName];
                    //如果是字符串，注入store's state
                    if (is_string_1.default(propValue)) {
                        relaxProps[propName] = store.state().get(propValue);
                    }
                    else if (is_array_1.default(propValue)) {
                        relaxProps[propName] = store.state().getIn(propValue);
                    }
                    else if (typeof (propValue) === 'function') {
                        const storeMethod = store[propName];
                        relaxProps[propName] = storeMethod || propValue;
                        //warning...
                        if (process.env.NODE_ENV != 'production') {
                            if (!storeMethod) {
                                console.warn('store can not find `${propName} method.`');
                            }
                        }
                    }
                    else if (propValue instanceof ql_1.QueryLang) {
                        relaxProps[propName] = store.bigQuery(propValue);
                    }
                    else if (propValue instanceof ql_1.DynamicQueryLang) {
                        if (!this._dql2QL[propName]) {
                            //根据DynamicQueryLang保存一份QL
                            //先用DQL的lang来填充QL
                            //后面会根据Dynamic的动态的计算lang
                            this._dql2QL[propName] = new ql_1.QueryLang(propValue.name(), propValue.lang());
                        }
                        dqlMap[propName] = propValue;
                    }
                }
                //计算dql
                for (let propName in dqlMap) {
                    const dql = dqlMap[propName];
                    const lang = dql.withContext(props).analyserLang(dql.lang());
                    const ql = this._dql2QL[propName].setLang(lang);
                    relaxProps[propName] = store.bigQuery(ql);
                }
                return relaxProps;
            }
        },
        //displayName
        _a.displayName = `Relax(${getDisplayName(Wrapper)})`,
        //拷贝WrapperComponent的defaultProps
        _a.defaultProps = Wrapper.defaultProps || {},
        //拷贝WrapperComponent的relaxProps
        //注入和store关联的数据和方法
        _a.relaxProps = Wrapper.relaxProps || {},
        //声明上下文依赖
        _a.contextTypes = {
            _plume$Store: React.PropTypes.object
        },
        _a;
    function _isNotValidValue(v) {
        return (typeof (v) != 'undefined' && v != null);
    }
    function getDisplayName(WrappedComponent) {
        return WrappedComponent.displayName || WrappedComponent.name || 'Component';
    }
    var _a;
}
exports.default = RelaxContainer;
